const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d+$/;

export const validateRequired = (value) => {
  if (!value || value.toString().trim() === '') {
    return 'This field is required.';
  }
  return null;
};

export const validateEmail = (email) => {
  const requiredError = validateRequired(email);
  if (requiredError) return requiredError;
  if (!EMAIL_REGEX.test(email.trim())) {
    return 'Enter a valid email address (e.g. user@domain.com).';
  }
  return null;
};

export const validatePhone = (phone) => {
  const requiredError = validateRequired(phone);
  if (requiredError) return requiredError;
  if (!PHONE_REGEX.test(phone.trim())) {
    return 'Phone number must contain digits only.';
  }
  if (phone.trim().length < 7 || phone.trim().length > 15) {
    return 'Phone number must be between 7 and 15 digits.';
  }
  return null;
};

export const validateFullName = (name) => {
  const requiredError = validateRequired(name);
  if (requiredError) return requiredError;
  if (name.trim().length > 50) {
    return 'Full name must not exceed 50 characters.';
  }
  return null;
};

export const validatePassword = (password) => {
  const requiredError = validateRequired(password);
  if (requiredError) return requiredError;
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }
  return null;
};

export const validateGender = (gender) => {
  if (!gender) return 'Please select a gender.';
  return null;
};

export const validateLanguage = (language) => {
  if (!language) return 'Please select a language.';
  return null;
};

export const validatePhoto = (photo) => {
  if (!photo) return 'Please add a profile photo.';
  return null;
};

export const validateRegisterForm = (fields) => {
  return {
    photo: validatePhoto(fields.photo),
    fullName: validateFullName(fields.fullName),
    phone: validatePhone(fields.phone),
    gender: validateGender(fields.gender),
    email: validateEmail(fields.email),
    language: validateLanguage(fields.language),
    password: validatePassword(fields.password),
  };
};

export const hasValidationErrors = (errors) => {
  return Object.values(errors).some((error) => error !== null);
};
