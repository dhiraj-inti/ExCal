import React, { useState } from 'react';
import ExpenseCard from './ExpenseCard';

const MonthlyCard = ({ expenses, monthYear, onUpdate, onDelete, openModal }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate total amount spent for this month-year
  const totalAmount = expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <div
        className="cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-lg font-semibold">{monthYear}</h2>
        <span>{isExpanded ? '-' : '+'}</span>
      </div>
      {isExpanded && (
        <div className="mt-2">
          <p className="text-gray-600">Total Amount Spent: Rs. {totalAmount.toFixed(2)}</p>
          {expenses.map((expense) => (
            <ExpenseCard 
                key={expense._id} 
                expense={expense}
                onUpdate={(updatedExpense) => onUpdate(updatedExpense)}
                onDelete={(id) => onDelete(id)}
                onEdit={(expense) => openModal(expense)}
                />
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthlyCard;
