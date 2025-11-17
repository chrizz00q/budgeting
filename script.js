let budgetData = {
    period: '',
    income: 0,
    expenses: []
};

function selectPeriod(period) {
    budgetData.period = period;
    const periodText = period.charAt(0).toUpperCase() + period.slice(1);
    
    // Update income label
    document.getElementById('income-label').textContent = `${periodText} Income:`;
    
    // Switch to income section
    document.getElementById('period-section').classList.remove('active');
    document.getElementById('income-section').classList.add('active');
}

function saveIncome() {
    const incomeInput = document.getElementById('income');
    const income = parseFloat(incomeInput.value);
    
    if (isNaN(income) || income <= 0) {
        alert('Please enter a valid income amount');
        return;
    }
    
    budgetData.income = income;
    
    // Switch to expenses section
    document.getElementById('income-section').classList.remove('active');
    document.getElementById('expenses-section').classList.add('active');
}

function addExpense() {
    const categoryInput = document.getElementById('expense-category');
    const amountInput = document.getElementById('expense-amount');
    
    const category = categoryInput.value.trim();
    const amount = parseFloat(amountInput.value);
    
    if (!category) {
        alert('Please enter an expense category');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid expense amount');
        return;
    }
    
    // Add expense to data
    budgetData.expenses.push({ category, amount });
    
    // Update expenses list
    updateExpensesList();
    
    // Clear inputs
    categoryInput.value = '';
    amountInput.value = '';
    categoryInput.focus();
}

function updateExpensesList() {
    const expensesList = document.getElementById('expenses-list');
    expensesList.innerHTML = '';
    
    budgetData.expenses.forEach((expense, index) => {
        const expenseItem = document.createElement('div');
        expenseItem.className = 'expense-item';
        expenseItem.innerHTML = `
            <span class="category">${expense.category}</span>
            <span class="amount">₱${expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            <button class="delete-btn" onclick="deleteExpense(${index})">Delete</button>
        `;
        expensesList.appendChild(expenseItem);
    });
}

function deleteExpense(index) {
    budgetData.expenses.splice(index, 1);
    updateExpensesList();
}

function calculateBudget() {
    if (budgetData.expenses.length === 0) {
        alert('Please add at least one expense');
        return;
    }
    
    const totalExpenses = budgetData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remainingBalance = budgetData.income - totalExpenses;
    const savingsRate = (remainingBalance / budgetData.income) * 100;
    
    // Update summary cards
    document.getElementById('total-income').textContent = `₱${budgetData.income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    document.getElementById('total-expenses').textContent = `₱${totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    document.getElementById('remaining-balance').textContent = `₱${remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
    
    // Update expense breakdown
    updateExpenseBreakdown(totalExpenses);
    
    // Update conversion results
    updateConversionResults();
    
    // Switch to results section
    document.getElementById('expenses-section').classList.remove('active');
    document.getElementById('results-section').classList.add('active');
}

function updateExpenseBreakdown(totalExpenses) {
    const breakdownElement = document.getElementById('expense-breakdown');
    breakdownElement.innerHTML = '';
    
    budgetData.expenses.forEach(expense => {
        const percentage = ((expense.amount / totalExpenses) * 100).toFixed(1);
        const breakdownItem = document.createElement('div');
        breakdownItem.className = 'breakdown-item';
        breakdownItem.innerHTML = `
            <span>${expense.category}</span>
            <span>₱${expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (${percentage}%)</span>
        `;
        breakdownElement.appendChild(breakdownItem);
    });
}

function updateConversionResults() {
    const conversionElement = document.getElementById('conversion-results');
    conversionElement.innerHTML = '';
    
    let weeklyIncome, monthlyIncome, yearlyIncome;
    
    switch (budgetData.period) {
        case 'weekly':
            weeklyIncome = budgetData.income;
            monthlyIncome = budgetData.income * 4.33;
            yearlyIncome = budgetData.income * 52;
            break;
        case 'monthly':
            weeklyIncome = budgetData.income / 4.33;
            monthlyIncome = budgetData.income;
            yearlyIncome = budgetData.income * 12;
            break;
        case 'yearly':
            weeklyIncome = budgetData.income / 52;
            monthlyIncome = budgetData.income / 12;
            yearlyIncome = budgetData.income;
            break;
    }
    
    const conversions = [
        { label: 'Weekly', amount: weeklyIncome },
        { label: 'Monthly', amount: monthlyIncome },
        { label: 'Yearly', amount: yearlyIncome }
    ];
    
    conversions.forEach(conv => {
        if (conv.label.toLowerCase() !== budgetData.period) {
            const conversionItem = document.createElement('div');
            conversionItem.className = 'conversion-item';
            conversionItem.innerHTML = `
                <span>${conv.label}:</span>
                <span>₱${conv.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            `;
            conversionElement.appendChild(conversionItem);
        }
    });
}

function startOver() {
    // Reset data
    budgetData = {
        period: '',
        income: 0,
        expenses: []
    };
    
    // Reset form
    document.getElementById('income').value = '';
    document.getElementById('expense-category').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expenses-list').innerHTML = '';
    
    // Go back to period selection
    document.getElementById('results-section').classList.remove('active');
    document.getElementById('period-section').classList.add('active');
}

function saveToFile() {
    const totalExpenses = budgetData.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const remainingBalance = budgetData.income - totalExpenses;
    
    let content = `PHILIPPINE BUDGETING SYSTEM - ${budgetData.period.toUpperCase()} BUDGET\n`;
    content += '='.repeat(50) + '\n\n';
    content += `INCOME:\n`;
    content += `${budgetData.period.charAt(0).toUpperCase() + budgetData.period.slice(1)} Income: ₱${budgetData.income.toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n\n`;
    content += `EXPENSES:\n`;
    
    budgetData.expenses.forEach(expense => {
        content += `  ${expense.category}: ₱${expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n`;
    });
    
    content += `\nTotal Expenses: ₱${totalExpenses.toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n`;
    content += `Remaining Balance: ₱${remainingBalance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${budgetData.period}_budget.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Budget saved successfully!');
}

// Add keyboard support
document.addEventListener('DOMContentLoaded', function() {
    // Enter key support for income input
    document.getElementById('income').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveIncome();
        }
    });
    
    // Enter key support for expense amount
    document.getElementById('expense-amount').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addExpense();
        }
    });
});