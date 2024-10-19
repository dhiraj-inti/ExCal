import React, { useEffect, useState } from 'react';
import ExpenseCard from './ExpenseCard';
import MonthlyCard from './MonthlyCard';
import Modal from './Modal'; // Import your Modal component
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faFileUpload } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse'; // Import the CSV parsing library

const ViewExpenses = ({ expenses, setExpenses }) => {
  const [selectedOption, setSelectedOption] = useState('monthly');
  const [sortedExpenses, setSortedExpenses] = useState([]);
  const [totalDailyAmount, setTotalDailyAmount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for controlling the modal
  const [currentExpense, setCurrentExpense] = useState(null); // State to store the current expense being edited
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    // Sort expenses in descending order based on date (latest first)
    const sortedExpensesTemp = expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    setSortedExpenses(sortedExpensesTemp);

    // Calculate total amount spent till date for 'daily' option
    const dailyAmount = expenses.reduce((total, expense) => total + parseFloat(expense.amount), 0);
    setTotalDailyAmount(dailyAmount);
  }, [expenses]);

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  const handleUpdateExpense = async (updatedExpense) => {
    const { id, date, description, amount } = updatedExpense;
    // Call your API to update the expense here
    const resp = await fetch(`${baseUrl}/api/expense/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'token': localStorage.getItem('token'),
      },
      body: JSON.stringify({ id, date, description, amount }),
    });

    const res = await resp.json();
    if (res.success) {
      const updatedExpenses = expenses.map((expense) =>
        expense._id === id ? { ...expense, date, description, amount } : expense
      );
      setExpenses(updatedExpenses);
      setIsModalOpen(false); // Close the modal after updating
    }
  };

  const handleDeleteExpense = async (id) => {
    const resp = await fetch(`${baseUrl}/api/expense/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'token': localStorage.getItem('token'),
      },
      body: JSON.stringify({ id }),
    });

    const res = await resp.json();
    if (res.success) {
      const updatedExpenses = expenses.filter((expense) => expense._id !== id);
      setExpenses(updatedExpenses);
    }
  };

  const openModal = (expense) => {
    setCurrentExpense(expense);
    setIsModalOpen(true);
  };

  const convertToCSV = (data) => {
    const headers = ['Date', 'Description', 'Amount'];
    const rows = data.map((expense) => [expense.date, expense.description, expense.amount]);
    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    return csvContent;
  };

  const downloadCSV = () => {
    const csvData = convertToCSV(expenses);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'expenses_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];

    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const parsedExpenses = results.data.map((row) => ({
            date: row.Date,
            description: row.Description,
            amount: parseFloat(row.Amount),
          }));

          const validExpenses = parsedExpenses.filter(expense => {
            return expense.date && expense.description && expense.amount !== null && expense.amount !== undefined;
          });
          
          // Send parsed expenses to the API
          const resp = await fetch(`${baseUrl}/api/expense/addMany`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'token': localStorage.getItem('token'),
            },
            body: JSON.stringify({ expenses: validExpenses }),
          });

          const res = await resp.json();
          
          if (res.success) {
            setExpenses([...expenses, ...res.data]); // Update expenses state with the new data
          }
        },
      });
    }
  };

  const renderExpenses = () => {
    switch (selectedOption) {
      case 'monthly':
        return renderMonthlyExpenses();
      case 'daily':
        return renderDailyExpenses();
      case 'yearly':
        return renderYearlyExpenses(); // Add case for yearly expenses
      default:
        return null;
    }
  };

  const renderMonthlyExpenses = () => {
    const uniqueMonthYears = Array.from(
      new Set(
        sortedExpenses.map((expense) =>
          new Date(expense.date).toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
          })
        )
      )
    );


    return uniqueMonthYears.map((monthYear) => (
      <MonthlyCard
        key={monthYear}
        expenses={sortedExpenses.filter((expense) => {
          const expenseMonthYear = new Date(expense.date).toLocaleDateString('en-GB', {
            month: 'long',
            year: 'numeric',
          });
          return expenseMonthYear === monthYear;
        })}
        monthYear={monthYear}
        onUpdate={(updatedExpense) => handleUpdateExpense(updatedExpense)}
        onDelete={(id) => handleDeleteExpense(id)}
        openModal={(expense) => openModal(expense)}
      />
    ));
  };

  const renderDailyExpenses = () => {
    return (
      <div>
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <h2 className="text-lg font-semibold mb-2">Total Amount Spent Till Date</h2>
          <p className="text-gray-600">Rs. {totalDailyAmount.toFixed(2)}</p>
        </div>
        {expenses.map((expense) => (
          <ExpenseCard
            key={expense._id}
            expense={expense}
            onUpdate={(updatedExpense) => handleUpdateExpense(updatedExpense)}
            onDelete={(id) => handleDeleteExpense(id)}
            onEdit={(expense) => openModal(expense)}
          />
        ))}
      </div>
    );
  };

  const renderYearlyExpenses = () => {
    // Logic to group expenses by year and display them
    const uniqueYears = Array.from(
      new Set(
        sortedExpenses.map((expense) =>
          new Date(expense.date).toLocaleDateString('en-GB', {
            year: 'numeric',
          })
        )
      )
    );

    
    
    return uniqueYears.map((year) => (
      <MonthlyCard
        key={year}
        expenses={sortedExpenses.filter(
          (expense) => new Date(expense.date).getFullYear().toString() === year.toString()
        )}
        monthYear={year}
        onUpdate={(updatedExpense) => handleUpdateExpense(updatedExpense)}
        onDelete={(id) => handleDeleteExpense(id)}
        openModal={(expense) => openModal(expense)}
      />
    ));
  };

  return (
    <div className="m-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg pl-10 pt-8 font-semibold">View Expenses</h2>
        <div className="flex space-x-4 pr-10 pt-8">
          <button
              className="px-4 py-2 rounded-md bg-blue-600 text-white flex items-center hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-700 transition-colors duration-300"
              onClick={downloadCSV}
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            Report
          </button>
          <label className="cursor-pointer px-4 py-2 rounded-md bg-blue-600 text-white flex items-center hover:bg-gradient-to-r hover:from-blue-500 hover:to-blue-700 transition-colors duration-300">
            <FontAwesomeIcon icon={faFileUpload} className="mr-2" />
            Upload CSV
            <input
              type="file"
              accept=".csv"
              className='hidden'
              onChange={handleCSVUpload}
            />
          </label>
          <button
              className={`px-4 py-2 rounded-md ${
                selectedOption === 'yearly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              } hover:bg-blue-600 transition-colors duration-300`}
              onClick={() => handleOptionChange('yearly')}
          >
            Yearly
          </button>

          <button
            className={`px-4 py-2 rounded-md ${
              selectedOption === 'monthly' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            } hover:bg-blue-600 transition-colors duration-300`}
            onClick={() => handleOptionChange('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              selectedOption === 'daily' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            } hover:bg-blue-600 transition-colors duration-300`}
            onClick={() => handleOptionChange('daily')}
          >
            Daily
          </button>
          
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        {renderExpenses()}
      </div>
      {/* Modal component */}
      {isModalOpen && currentExpense._id && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} expense={currentExpense} onUpdate={handleUpdateExpense} />
      )}
    </div>
  );
};

export default ViewExpenses;
