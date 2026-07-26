import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Validation schemas
const signupSchema = Joi.object({
    username: Joi.string()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required()
        .messages({
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username must not exceed 30 characters',
            'string.pattern.base': 'Username can only contain letters, numbers, and underscores',
            'any.required': 'Username is required'
        }),
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters',
            'any.required': 'Password is required'
        }),
    displayName: Joi.string()
        .max(50)
        .required()
        .messages({
            'string.max': 'Display name must not exceed 50 characters',
            'any.required': 'Display name is required'
        }),
    accountType: Joi.string()
        .valid('Personal', 'Work', 'Business')
        .required()
        .messages({
            'any.only': 'Account type must be Personal, Work, or Business',
            'any.required': 'Account type is required'
        })
});

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required'
        })
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        })
});

const resetPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    providedCode: Joi.string()
        .required()
        .messages({
            'any.required': 'Verification code is required'
        }),
    newPassword: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters',
            'any.required': 'New password is required'
        })
});

const updateProfileSchema = Joi.object({
    email: Joi.string()
        .email()
        .optional()
        .messages({
            'string.email': 'Please provide a valid email address'
        }),
    username: Joi.string()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .optional()
        .messages({
            'string.min': 'Username must be at least 3 characters',
            'string.max': 'Username must not exceed 30 characters',
            'string.pattern.base': 'Username can only contain letters, numbers, and underscores'
        }),
    displayName: Joi.string()
        .max(50)
        .optional()
        .messages({
            'string.max': 'Display name must not exceed 50 characters'
        }),
    bio: Joi.string()
        .max(500)
        .optional()
        .allow('')
        .messages({
            'string.max': 'Bio must not exceed 500 characters'
        }),
    link: Joi.string()
        .uri()
        .optional()
        .allow('')
        .messages({
            'string.uri': 'Please provide a valid URL'
        }),
    location: Joi.string()
        .optional()
        .allow(''),
    gender: Joi.string()
        .valid('male', 'female', 'non-binary', 'other', '')
        .optional()
        .messages({
            'any.only': 'Gender must be male, female, non-binary, or other'
        }),
    accountType: Joi.string()
        .valid('Personal', 'Work', 'Business')
        .optional()
        .messages({
            'any.only': 'Account type must be Personal, Work, or Business'
        }),
    accountVisibility: Joi.string()
        .valid('Public', 'Private', 'Friends')
        .optional()
        .messages({
            'any.only': 'Account visibility must be Public, Private, or Friends'
        }),
    avatarUrl: Joi.string()
        .optional()
        .allow(''),
    coverImg: Joi.string()
        .optional()
        .allow(''),
    socialHandles: Joi.array()
        .items(Joi.object({
            platform: Joi.string().required(),
            url: Joi.string().uri().required()
        }))
        .optional()
        .messages({
            'string.uri': 'Social handle URLs must be valid'
        })
});

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Current password is required'
        }),
    newPassword: Joi.string()
        .min(8)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters',
            'any.required': 'New password is required'
        })
});

const sendVerificationCodeSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        })
});

const verifyVerificationCodeSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required'
        }),
    providedCode: Joi.string()
        .required()
        .messages({
            'any.required': 'Verification code is required'
        })
});

// Export all schemas
export const schemas = {
    signup: signupSchema,
    login: loginSchema,
    forgotPassword: forgotPasswordSchema,
    resetPassword: resetPasswordSchema,
    updateProfile: updateProfileSchema,
    changePassword: changePasswordSchema,
    sendVerificationCode: sendVerificationCodeSchema,
    verifyVerificationCode: verifyVerificationCodeSchema
};

// Middleware factory
export const validate = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errors = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'validation',
                message: 'Validation failed',
                errors
            });
        }

        // Replace req.body with validated and sanitized data
        req.body = value;
        next();
    };
};
