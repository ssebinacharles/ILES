import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { username } = formData;

    // Demo role logic – replace with real authentication.
    let userRole = null;
    if (username === "student") userRole = "STUDENT";
    else if (username === "supervisor") userRole = "SUPERVISOR";
    else if (username === "admin") userRole = "ADMINISTRATOR";
