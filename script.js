        // Chart instances
        let incomeChart = null;

        // Formatting helpers for currency display
        function formatNumberWithCommas(num) {
            return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }

        function formatCurrency(amount) {
            return `₱${formatNumberWithCommas(amount)}`;
        }

        // Show notification
        function showNotification(message, type = 'success') {
            const notification = document.getElementById('notification');
            const notificationText = document.getElementById('notificationText');
            const icon = notification.querySelector('i');
            
            notificationText.textContent = message;
            notification.className = `notification ${type}`;
            
            if (type === 'success') {
                icon.className = 'fas fa-check-circle';
            } else {
                icon.className = 'fas fa-exclamation-circle';
            }
            
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // Set quick amount
        function setQuickAmount(amount) {
            document.getElementById('amount').value = amount;
        }

        function updateIncomeChart() {
            const ctx = document.getElementById('incomeChart').getContext('2d');
            
            // Get income data for the current month
            const monthTransactions = transactions.filter(t => t.frequency === 'monthly' || isInCurrentMonth(t.date));
            const incomeTransactions = monthTransactions.filter(t => t.type === 'income');
            
            // Group income by category
            const categoryTotals = {};
            incomeTransactions.forEach(t => {
                if (!categoryTotals[t.category]) {
                    categoryTotals[t.category] = 0;
                }
                categoryTotals[t.category] += t.amount;
            });
            
            const categories = Object.keys(categoryTotals);
            const amounts = Object.values(categoryTotals);
            
            // Generate colors for categories
            const colors = [
                '#10b981', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', 
                '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'
            ];
            
            const categoryColors = categories.map((_, i) => colors[i % colors.length]);
            
            // Update chart legend
            const legend = document.getElementById('incomeLegend');
            legend.innerHTML = categories.map((category, i) => `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${categoryColors[i]};"></div>
                    <span>${category}: ${formatCurrency(categoryTotals[category])}</span>
                </div>
            `).join('');
            
            // Update center amount
            const totalIncome = amounts.reduce((a, b) => a + b, 0);
            document.getElementById('incomeAmount').textContent = formatCurrency(totalIncome);
            
            if (!incomeChart) {
                incomeChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: categories,
                        datasets: [{
                            data: amounts,
                            backgroundColor: categoryColors,
                            hoverOffset: 6,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: { 
                                display: false
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const total = amounts.reduce((a, b) => a + b, 0);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            } else {
                incomeChart.data.labels = categories;
                incomeChart.data.datasets[0].data = amounts;
                incomeChart.data.datasets[0].backgroundColor = categoryColors;
                incomeChart.update();
            }
        }

        function getCurrentWeekData() {
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            
            const weekTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.date);
                return transactionDate >= weekStart && transactionDate <= weekEnd;
            });
            
            const weekIncome = weekTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const weekExpenses = weekTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);
                
            const weekNet = weekIncome - weekExpenses;
            
            return {
                income: weekIncome,
                expenses: weekExpenses,
                net: weekNet
            };
        }

        function updateWeeklyStats() {
            const weekData = getCurrentWeekData();
            
            document.getElementById('weeklyIncome').textContent = formatCurrency(weekData.income);
            document.getElementById('weeklyExpenses').textContent = formatCurrency(weekData.expenses);
            document.getElementById('weeklyNet').textContent = formatCurrency(weekData.net);
            
            // Set trend indicator
            const trendElement = document.getElementById('weeklyTrend');
            if (weekData.net > 0) {
                trendElement.textContent = '↗️';
                trendElement.style.color = '#10b981';
            } else if (weekData.net < 0) {
                trendElement.textContent = '↘️';
                trendElement.style.color = '#ef4444';
            } else {
                trendElement.textContent = '→';
                trendElement.style.color = '#666';
            }
        }

        let transactions = [];
        let currentMonth = new Date();
        let currentTab = 'all';

        // Persist transactions to localStorage
        function saveTransactions() {
            try {
                localStorage.setItem('budget_transactions', JSON.stringify(transactions));
            } catch (e) {
                console.warn('Could not save transactions to localStorage', e);
            }
        }

        function loadTransactions() {
            try {
                const raw = localStorage.getItem('budget_transactions');
                if (raw) {
                    transactions = JSON.parse(raw);
                    // ensure sorting
                    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
                }
            } catch (e) {
                console.warn('Could not load transactions from localStorage', e);
            }
        }

        const expenseCategories = ['Food', 'Transport', 'Housing', 'Entertainment', 'Healthcare', 'Shopping', 'Utilities', 'Other'];
        const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];

        // Set today's date as default
        document.getElementById('transactionDate').valueAsDate = new Date();

        function updateCategoryOptions() {
            const type = document.getElementById('transactionType').value;
            const categorySelect = document.getElementById('category');
            const frequencySelect = document.getElementById('frequency');
            const categories = type === 'income' ? incomeCategories : expenseCategories;
            
            categorySelect.innerHTML = categories.map(cat => 
                `<option value="${cat}">${cat}</option>`
            ).join('');

            // Suggest monthly for salary/rent, daily for food/transport
            if (type === 'income') {
                frequencySelect.value = 'monthly';
            } else {
                const category = categorySelect.value;
                if (category === 'Housing' || category === 'Utilities') {
                    frequencySelect.value = 'monthly';
                } else {
                    frequencySelect.value = 'once';
                }
            }
        }

        function changeMonth(delta) {
            currentMonth.setMonth(currentMonth.getMonth() + delta);
            updateUI();
        }

        function formatMonthYear(date) {
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        function isInCurrentMonth(dateStr) {
            const date = new Date(dateStr);
            return date.getMonth() === currentMonth.getMonth() && 
                   date.getFullYear() === currentMonth.getFullYear();
        }

        function addTransaction() {
            const type = document.getElementById('transactionType').value;
            const description = document.getElementById('description').value.trim();
            const amount = parseFloat(document.getElementById('amount').value);
            const category = document.getElementById('category').value;
            const date = document.getElementById('transactionDate').value;
            const frequency = document.getElementById('frequency').value;

            // Description is optional
            if (!amount || amount <= 0 || !date) {
                showNotification('Please fill in all fields with valid values', 'error');
                return;
            }

            const transaction = {
                id: Date.now(),
                type,
                description,
                amount,
                category,
                date,
                frequency
            };

            transactions.push(transaction);
            transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

            saveTransactions();

            document.getElementById('description').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('transactionDate').valueAsDate = new Date();
            
            showNotification(`${type === 'income' ? 'Income' : 'Expense'} added successfully!`);
            updateUI();
        }

        function deleteTransaction(id) {
            if (!confirm('Delete this transaction?')) return;
            transactions = transactions.filter(item => item.id !== id);
            saveTransactions();
            updateUI();
            showNotification('Transaction deleted successfully!');
        }

        function switchTab(tab, evt) {
            currentTab = tab;

            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            if (evt && evt.target) evt.target.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');

            updateUI();
        }

        function formatDate(dateStr) {
            const date = new Date(dateStr);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            today.setHours(0, 0, 0, 0);
            yesterday.setHours(0, 0, 0, 0);
            date.setHours(0, 0, 0, 0);
            
            if (date.getTime() === today.getTime()) return 'Today';
            if (date.getTime() === yesterday.getTime()) return 'Yesterday';
            
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        }

        function getCategoryIcon(category) {
            const icons = {
                'Food': 'fas fa-utensils',
                'Transport': 'fas fa-bus',
                'Housing': 'fas fa-home',
                'Entertainment': 'fas fa-film',
                'Healthcare': 'fas fa-heartbeat',
                'Shopping': 'fas fa-shopping-bag',
                'Utilities': 'fas fa-bolt',
                'Other': 'fas fa-circle',
                'Salary': 'fas fa-money-check',
                'Freelance': 'fas fa-laptop',
                'Business': 'fas fa-briefcase',
                'Investment': 'fas fa-chart-line',
                'Gift': 'fas fa-gift'
            };
            
            return icons[category] || 'fas fa-circle';
        }

        function renderTransactionItem(item) {
            const iconClass = getCategoryIcon(item.category);
            const iconBgClass = item.type === 'income' ? 'income-icon' : 'expense-icon';
            
            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-description">
                            <div class="category-icon ${iconBgClass}">
                                <i class="${iconClass}"></i>
                            </div>
                            ${item.category}
                            ${item.frequency === 'monthly' ? '<span class="recurring-badge">MONTHLY</span>' : ''}
                        </div>
                        <div class="transaction-meta">${item.description ? `${item.description} • ` : ''}${formatDate(item.date)}</div>
                    </div>
                    <span class="transaction-amount ${item.type === 'income' ? 'income-amount' : 'expense-amount'}">
                        ${item.type === 'income' ? '+' : '-'}${formatCurrency(item.amount)}
                    </span>
                    <button class="delete-btn" onclick="deleteTransaction(${item.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
        }

        function updateUI() {
            document.getElementById('currentMonth').textContent = formatMonthYear(currentMonth);

            // Include monthly recurring transactions for every month regardless of their original date
            const monthTransactions = transactions.filter(t => t.frequency === 'monthly' || isInCurrentMonth(t.date));
            const monthlyRecurring = transactions.filter(t => t.frequency === 'monthly');
            const dailyTransactions = monthTransactions.filter(t => t.frequency === 'once');

            const income = monthTransactions.filter(t => t.type === 'income');
            const expenses = monthTransactions.filter(t => t.type === 'expense');

            const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
            const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
            const balance = totalIncome - totalExpenses;

            // Update income chart
            updateIncomeChart();
            
            // Update weekly stats
            updateWeeklyStats();

            document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
            document.getElementById('balance').textContent = formatCurrency(balance);

            const periodText = formatMonthYear(currentMonth);
            document.getElementById('expensePeriod').textContent = periodText;
            document.getElementById('balancePeriod').textContent = periodText;

            // Update Monthly Tab
            const monthlyList = document.getElementById('monthlyList');
            if (monthlyRecurring.length === 0) {
                monthlyList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-sync"></i>
                        <p>No monthly recurring transactions yet</p>
                    </div>
                `;
            } else {
                const monthlyIncome = monthlyRecurring.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                const monthlyExpense = monthlyRecurring.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                document.getElementById('monthlyTotal').textContent = `Income: ${formatCurrency(monthlyIncome)} | Expenses: ${formatCurrency(monthlyExpense)}`;
                monthlyList.innerHTML = monthlyRecurring.map(renderTransactionItem).join('');
            }

            // Update Daily Tab
            const dailyList = document.getElementById('dailyList');
            if (dailyTransactions.length === 0) {
                dailyList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-day"></i>
                        <p>No daily expenses yet</p>
                    </div>
                `;
            } else {
                const dailyTotal = dailyTransactions.reduce((s, t) => s + t.amount, 0);
                document.getElementById('dailyTotal').textContent = formatCurrency(dailyTotal);
                
                // Group by date
                const groupedByDate = {};
                dailyTransactions.forEach(t => {
                    if (!groupedByDate[t.date]) {
                        groupedByDate[t.date] = [];
                    }
                    groupedByDate[t.date].push(t);
                });

                const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
                
                dailyList.innerHTML = dates.map(date => {
                    const dayTransactions = groupedByDate[date];
                    const dayTotal = dayTransactions.reduce((s, t) => s + t.amount, 0);
                    
                    return `
                        <div class="transaction-day-group">
                            <div class="day-header">
                                <h3>${formatDate(date)}</h3>
                                <div class="day-summary">-${formatCurrency(dayTotal)}</div>
                            </div>
                            ${dayTransactions.map(renderTransactionItem).join('')}
                        </div>
                    `;
                }).join('');
            }

            // Update All Tab
            const allList = document.getElementById('allList');
            if (monthTransactions.length === 0) {
                allList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-list"></i>
                        <p>No transactions yet</p>
                    </div>
                `;
            } else {
                const groupedByDate = {};
                monthTransactions.forEach(t => {
                    if (!groupedByDate[t.date]) {
                        groupedByDate[t.date] = [];
                    }
                    groupedByDate[t.date].push(t);
                });

                const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));
                
                allList.innerHTML = dates.map(date => {
                    const dayTransactions = groupedByDate[date];
                    const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                    const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                    
                    return `
                        <div class="transaction-day-group">
                            <div class="day-header">
                                <h3>${formatDate(date)}</h3>
                                <div class="day-summary">
                                    ${dayIncome > 0 ? `<span style="color: #10b981;">+${formatCurrency(dayIncome)}</span>` : ''}
                                    ${dayExpense > 0 ? `<span style="color: #ef4444; margin-left: 10px;">-${formatCurrency(dayExpense)}</span>` : ''}
                                </div>
                            </div>
                            ${dayTransactions.map(renderTransactionItem).join('')}
                        </div>
                    `;
                }).join('');
            }
        }

        document.getElementById('amount').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTransaction();
            }
        });

        document.getElementById('description').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTransaction();
            }
        });

        // Initialize
        loadTransactions();
        updateCategoryOptions();
        updateUI()
