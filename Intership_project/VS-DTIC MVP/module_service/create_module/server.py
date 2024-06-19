from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import aio_pika
import json
import tempfile
import shutil
import subprocess
import os
import time
from models import Base, Module

SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://alek:1234@mysql:3306/radiance"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)
app = FastAPI()

async def connect_to_rabbitmq():
    try:
        connection = await aio_pika.connect_robust("amqp://rabbitmq:5672")
        return connection
    except Exception as e:
        print(f"Failed to connect to RabbitMQ: {e}")
        return None

async def publish_to_rabbitmq(connection, module_id, module_name, script_content, requirements_content):
    if connection is None:
        return False
    try:
        channel = await connection.channel()
        message = {
            'module_name': module_name,
            'script_content': script_content.decode('utf-8'),
            'requirements_content': requirements_content,
            'module_id': module_id
        }
        await channel.default_exchange.publish(
            aio_pika.Message(body=json.dumps(message).encode()),
            routing_key='module_queue'
        )
        print(" [x] Sent message to RabbitMQ")
        await connection.close()
        return True
    except Exception as e:
        print(f"Failed to publish message: {e}")
        return False

def delete_directory_with_retry(directory, max_retries=3, delay=1):
    retries = 0
    while retries < max_retries:
        try:
            shutil.rmtree(directory)
            print("Directory deleted")
            break
        except Exception as e:
            print(f"Error deleting directory: {e}")
            retries += 1
            time.sleep(delay)

@app.post('/upload_module')
async def upload_module(json_data: dict):
    module_name = json_data.get("module_name")
    module_description = json_data.get("module_description")
    github_url = json_data.get("github_url")
    file_name = json_data.get("file_name")

    if not all([module_name, module_description, github_url, file_name]):
        return {"error": "All fields are required"}

    db = SessionLocal()
    if db.query(Module).filter(Module.name == module_name).first():
        db.close()
        return {"error": "A module with this name already exists"}

    temp_dir = tempfile.mkdtemp()
    try:
        subprocess.run(['git', 'clone', github_url, temp_dir], check=True)
        script_path = os.path.join(temp_dir, file_name)
        if not os.path.isfile(script_path):
            return {"error": f"The script file '{file_name}' does not exist in the repository"}

        requirements_path = os.path.join(temp_dir, 'requirements.txt')
        if not os.path.isfile(requirements_path):
            return {"error": "The 'requirements.txt' file does not exist in the repository"}

        with open(script_path, 'rb') as script_file:
            script_content = script_file.read()
        with open(requirements_path, 'rb') as requirements_file:
            requirements_content = requirements_file.read().decode('utf-8')

        module = Module(name=module_name, description=module_description, status="Pending")
        db.add(module)
        db.flush()  # Flush to assign ID without committing

        connection = await connect_to_rabbitmq()
        if await publish_to_rabbitmq(connection, module.id, module_name, script_content, requirements_content):
            module.status = "Not done"
            db.commit()  # Commit after successful publication
            return {"message": "Module uploaded successfully", "module_name": module_name, "module_description": module_description, "packages": requirements_content}
        else:
            db.rollback()  # Rollback if unable to publish
            return {"error": "Failed to connect to RabbitMQ or publish message"}
    finally:
        delete_directory_with_retry(temp_dir)
        db.close()  # Ensure the session is closed properly

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
