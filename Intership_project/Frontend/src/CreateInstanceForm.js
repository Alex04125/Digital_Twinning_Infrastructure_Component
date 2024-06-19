import React from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import styled from "styled-components";

const FormContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f4f8;
`;

const Form = styled.form`
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 400px;
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
`;

const Error = styled.p`
  color: red;
  font-size: 0.875rem;
  margin-top: 0.25rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

const CreateInstanceForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(
        "http://localhost:4000/create_instance",
        data
      );
      alert("Instance created successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("There was an error creating the instance!", error);
      alert("Failed to create instance");
    }
  };

  return (
    <FormContainer>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <FormGroup>
          <Label>Instance Name</Label>
          <Input {...register("instance_name", { required: true })} />
          {errors.instance_name && <Error>Instance name is required</Error>}
        </FormGroup>
        <FormGroup>
          <Label>Module Name</Label>
          <Input {...register("module_name", { required: true })} />
          {errors.module_name && <Error>Module name is required</Error>}
        </FormGroup>
        <FormGroup>
          <Label>GitHub URL</Label>
          <Input {...register("github_url", { required: true })} />
          {errors.github_url && <Error>GitHub URL is required</Error>}
        </FormGroup>
        <FormGroup>
          <Label>File Name</Label>
          <Input {...register("file_name", { required: true })} />
          {errors.file_name && <Error>File name is required</Error>}
        </FormGroup>
        <Button type="submit">Create Instance</Button>
      </Form>
    </FormContainer>
  );
};

export default CreateInstanceForm;
