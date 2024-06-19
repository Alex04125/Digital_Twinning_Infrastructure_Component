// src/GetVSValueForm.js

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

const GetVSValueForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "http://localhost:8000/get_vs_value",
        data
      );
      setResult(response.data);
      alert("Request processed successfully!");
    } catch (error) {
      setError(
        error.response?.data?.error ||
          "An error occurred while processing the request."
      );
      console.error("There was an error processing the request!", error);
    } finally {
      setLoading(false);
      reset();
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
          <Label>GitHub URL</Label>
          <Input {...register("github_url", { required: true })} />
          {errors.github_url && <Error>GitHub URL is required</Error>}
        </FormGroup>
        <FormGroup>
          <Label>File Name</Label>
          <Input {...register("file_name", { required: true })} />
          {errors.file_name && <Error>File name is required</Error>}
        </FormGroup>
        <Button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Get VS Value"}
        </Button>
        {result && (
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <h3>Result:</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        {error && <Error>{error}</Error>}
      </Form>
    </FormContainer>
  );
};

export default GetVSValueForm;
