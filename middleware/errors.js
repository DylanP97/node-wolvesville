module.exports.signUpErrors = (err) => {
  let errors = { general: "", email: "", password: "" };

  if (err.message.includes("email")) errors.email = "Cette adresse email n'est pas correcte.";

  if (err.message.includes("password"))
    errors.password =
      "Le mot de passe doit contenir 6 à 100 caractères avec une majuscule, une minuscule, un nombre, un caractère spécial et ne pas contenir d'espaces.";

  if (err.code === 11000 && Object.keys(err.keyValue)[0].includes("email"))
    errors.email = "Cette adresse email est déjà enregistré, connectez vous avec si c'est la vôtre ";

  return errors;
};

module.exports.signInErrors = (err) => {
  let errors = { credentials: "" };
  
    if (err.message.includes("not signup")) {
      errors.credentials = "Vous n'êtes pas inscrit.";
      return errors;
    }

  if (err.message.includes("email")) {
    errors.credentials = "Email ou mot de passe incorrect.";
    return errors;
  }

  if (err.message.includes("password")) {
    errors.credentials = "Email ou mot de passe incorrect.";
    return errors;
  } else return;
};
