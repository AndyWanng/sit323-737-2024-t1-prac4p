const express = require('express');
const winston = require('winston');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'calculator-microservice' },
    transports: [
        new winston.transports.Console({ format: winston.format.simple() }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' })
    ],
});

// Welcome route
app.get('/', (req, res) => {
    res.status(200).send("Welcome to the Calculator Microservice. Use /add, /subtract, /multiply, or /divide with ?num1=number&num2=number");
});

// Arithmetic operations as reusable functions
const operations = {
    add: (num1, num2) => num1 + num2,
    subtract: (num1, num2) => num1 - num2,
    multiply: (num1, num2) => num1 * num2,
    divide: (num1, num2) => {
        if (num2 === 0) throw new Error("Cannot divide by zero");
        return num1 / num2;
    }
};

// Validating input parameters
const validateInput = (req, res, next) => {
    const { num1, num2 } = req.query;
    if (isNaN(num1) || isNaN(num2)) {
        logger.error(`Invalid input: num1=${num1}, num2=${num2}`);
        return res.status(400).json({ statuscode: 400, msg: "Both num1 and num2 must be valid numbers" });
    }
    req.num1 = parseFloat(num1);
    req.num2 = parseFloat(num2);
    next();
};

// Arithmetic operations endpoint
app.get("/:operation", validateInput, (req, res, next) => {
    try {
        const { operation } = req.params;
        const { num1, num2 } = req;
        if (!(operation in operations)) {
            logger.error(`Operation not found: ${operation}`);
            return res.status(404).json({ statuscode: 404, msg: "Operation not found. Use add, subtract, multiply, or divide." });
        }
        const result = operations[operation](num1, num2);
        logger.info(`Operation ${operation} successful on ${num1} and ${num2}. Result = ${result}`);
        res.status(200).json({ statuscode: 200, data: result });
    } catch (error) {
        next(error);
    }
});

app.use((err, req, res, next) => {
    logger.error(err.message);
    res.status(500).json({ statuscode: 500, msg: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
