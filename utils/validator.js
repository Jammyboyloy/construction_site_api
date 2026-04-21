const validateSupervisor = ({ name, email, password, phone }) => {
  let errors = [];

  if (!name) errors.push("Name is required");
  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");
  if (!phone) errors.push("Phone is required");

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }
  }

  if (password && password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (phone) {
    if (!/^[0-9]+$/.test(phone)) {
      errors.push("Phone must contain only numbers");
    } else if (!phone.startsWith("0")) {
      errors.push("Phone must start with 0");
    } else if (phone.length !== 9) {
      errors.push("Phone must be exactly 9 digits");
    }
  }

  return errors;
};

const validateWorker = ({ name, email, password, phone, skill_type }) => {
  let errors = [];

  // 🔥 REQUIRED
  if (!name) errors.push("Name is required");
  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");
  if (!phone) errors.push("Phone is required");
  if (!skill_type) errors.push("Skill type is required");

  // 🔥 EMAIL FORMAT
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }
  }

  // 🔥 PASSWORD
  if (password && password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  // 🔥 PHONE (LOCAL ONLY)
  if (phone) {
    // 1️⃣ must be number only
    if (!/^[0-9]+$/.test(phone)) {
      errors.push("Phone must contain only numbers");
    }
    // 2️⃣ must start with 0
    else if (!phone.startsWith("0")) {
      errors.push("Phone must start with 0");
    }
    // 3️⃣ must be exactly 9 digits
    else if (phone.length !== 9) {
      errors.push("Phone must be exactly 9 digits");
    }
  }

  return errors;
};

const validateClient = ({
  name,
  email,
  password,
  phone,
  company_name,
  contact_person,
  address,
}) => {
  let errors = [];

  if (!name) errors.push("Name is required");
  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");
  if (!phone) errors.push("Phone is required");
  if (!company_name) errors.push("Company name is required");
  if (!contact_person) errors.push("Contact person is required");
  if (!address) errors.push("Address is required");

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }
  }

  if (password && password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (phone) {
    if (!/^[0-9]+$/.test(phone)) {
      errors.push("Phone must contain only numbers");
    } else if (!phone.startsWith("0")) {
      errors.push("Phone must start with 0");
    } else if (phone.length !== 9) {
      errors.push("Phone must be exactly 9 digits");
    }
  }

  return errors;
};

const validateMaterial = ({
  project_id,
  name,
  quantity,
  supplier,
  cost_per_unit,
}) => {
  let errors = [];

  if (!project_id) errors.push("Project is required");
  if (!name) errors.push("Name is required");
  if (!quantity) errors.push("Quantity is required");

  if (quantity && (isNaN(quantity) || Number(quantity) <= 0)) {
    errors.push("Quantity must be a valid number greater than 0");
  }

  if (cost_per_unit && (isNaN(cost_per_unit) || Number(cost_per_unit) < 0)) {
    errors.push("Cost per unit must be a valid number");
  }

  if (supplier && typeof supplier !== "string") {
    errors.push("Supplier must be a string");
  }

  return errors;
};

module.exports = {
  validateSupervisor,
  validateWorker,
  validateClient,
  validateMaterial,
};
