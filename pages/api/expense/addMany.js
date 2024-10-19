import connectToDatabase from '@/utilities/mongoose';
import authMiddleware from '@/utilities/middleware/authMiddleware';
import Expense from '@/models/Expense';
import User from '@/models/User';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            // Apply the auth middleware to extract user information
            await authMiddleware(req, res, async () => {
                // Extract user ID from the request data (decoded from token)
                const userId = req.data.user.id;

                // Connect to MongoDB
                await connectToDatabase();

                // Fetch user data from the database using the userId
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).json({ success: false, message: 'User not found' });
                }

                // Parse request body for expenses array
                const { expenses } = req.body;
                
                // Check if expenses is an array and not empty
                if (!Array.isArray(expenses) || expenses.length === 0) {
                    return res.status(400).json({ success: false, message: 'No expenses provided' });
                }

                // Validate and save each expense
                const savedExpenses = [];
                for (let expenseData of expenses) {
                    const { date, description, amount } = expenseData;

                    // Validate the fields
                    if (!date || !description || !amount) {
                        return res.status(400).json({ success: false, message: 'Missing required fields' });
                    }

                    // Create a new expense object
                    const newExpense = new Expense({
                        userId,
                        date: new Date(date), // Convert date string to Date object
                        description,
                        amount,
                    });

                    // Save each expense to MongoDB
                    const savedExpense = await newExpense.save();
                    savedExpenses.push(savedExpense);
                }

                res.status(201).json({ success: true, data: savedExpenses });
            });
        } catch (error) {
            console.error('Error adding expenses:', error);
            res.status(500).json({ success: false, error: 'Error adding expenses' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
