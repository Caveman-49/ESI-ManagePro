// Middleware de validation avec Zod
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return res.status(400).json({
        error: 'Données invalides.',
        details: errors
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

