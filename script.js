document.addEventListener('DOMContentLoaded', function() {
    // Получение элементов ввода
    const salaryInput = document.getElementById('salary-input');
    const previousBalanceInput = document.getElementById('previous-balance-input');
    const settingsSection = document.getElementById('settings-section');
    const resultsSection = document.getElementById('results-section');

    // Оплата кредитных карт
    const includeCreditsCheckbox = document.getElementById('include-credits');
    const creditSettings = document.getElementById('credit-settings');
    const creditAmountSlider = document.getElementById('credit-amount-slider');
    const creditAmountDisplay = document.getElementById('credit-amount-display');
    const creditMaxBtn = document.getElementById('credit-max-btn');
    const creditCardOptions = document.getElementById('credit-card-options').getElementsByClassName('option-button');

    // Накопления на покупку квартиры
    const includeSavingsCheckbox = document.getElementById('include-savings');
    const savingsSettings = document.getElementById('savings-settings');
    const savingsAmountSlider = document.getElementById('savings-amount-slider');
    const savingsAmountDisplay = document.getElementById('savings-amount-display');
    const savingsMaxBtn = document.getElementById('savings-max-btn');

    // Процент на инвестиции и минимальные ежедневные расходы
    const investmentOptions = document.getElementById('investment-options').getElementsByClassName('option-button');
    const dailyOptions = document.getElementById('daily-options').getElementsByClassName('option-button');

    // Сумма на "подушку"
    const cushionOptions = document.getElementById('cushion-options').getElementsByClassName('option-button');

    // Обязательные траты
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const mandatoryExpensesList = document.getElementById('mandatory-expenses-list');

    // Кнопка расчёта
    const calculateBtn = document.getElementById('calculate-btn');

    // Инициализация обязательных трат из localStorage
    let mandatoryExpenses = JSON.parse(localStorage.getItem('mandatoryExpenses')) || [];

    // Начальные значения
    let investmentPercentage = 0; // Стартовое значение 0%
    let dailyMin = 1500;
    let cushionAmount = 10000;
    let creditCardCount = 1;

    // Отображение блоков настроек при загрузке
    if (includeCreditsCheckbox.checked) {
        creditSettings.classList.remove('hidden');
    }

    if (includeSavingsCheckbox.checked) {
        savingsSettings.classList.remove('hidden');
    }

    // Функция форматирования чисел с разделением тысяч
    function formatNumber(number) {
        return number.toLocaleString('ru-RU');
    }

    // Функция для обновления списка обязательных трат
    function updateMandatoryExpensesList() {
        mandatoryExpensesList.innerHTML = '';
        mandatoryExpenses.forEach((expense, index) => {
            const expenseItem = document.createElement('div');
            expenseItem.classList.add('mandatory-expense-item');

            const expenseNameInput = document.createElement('input');
            expenseNameInput.type = 'text';
            expenseNameInput.value = expense.name;
            expenseNameInput.placeholder = 'Название';
            expenseNameInput.dataset.index = index;
            expenseNameInput.addEventListener('input', updateExpenseName);

            const expenseAmountInput = document.createElement('input');
            expenseAmountInput.type = 'text';
            expenseAmountInput.value = formatNumber(expense.amount);
            expenseAmountInput.placeholder = 'Сумма';
            expenseAmountInput.min = '0';
            expenseAmountInput.dataset.index = index;
            expenseAmountInput.addEventListener('input', updateExpenseAmount);

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            removeBtn.dataset.index = index;
            removeBtn.addEventListener('click', removeExpense);

            expenseItem.appendChild(expenseNameInput);
            expenseItem.appendChild(expenseAmountInput);
            expenseItem.appendChild(removeBtn);

            mandatoryExpensesList.appendChild(expenseItem);
        });

        // Сохранение в localStorage
        localStorage.setItem('mandatoryExpenses', JSON.stringify(mandatoryExpenses));
    }

    // Обновление названия траты
    function updateExpenseName(event) {
        const index = event.target.dataset.index;
        mandatoryExpenses[index].name = event.target.value;
        localStorage.setItem('mandatoryExpenses', JSON.stringify(mandatoryExpenses));
    }

    // Вызов функции при изменении обязательных трат
    function updateExpenseAmount(event) {
        const index = event.target.dataset.index;
        const rawValue = event.target.value.replace(/\s/g, '');
        mandatoryExpenses[index].amount = parseInt(rawValue, 10) || 0;
        event.target.value = mandatoryExpenses[index].amount > 0 ? formatNumber(mandatoryExpenses[index].amount) : '';
        updateTotalExpenses(); // Обновление итоговой суммы расходов
        localStorage.setItem('mandatoryExpenses', JSON.stringify(mandatoryExpenses));
    }

    // Удаление траты
    function removeExpense(event) {
        const index = event.currentTarget.dataset.index; // Используем event.currentTarget
        mandatoryExpenses.splice(index, 1);
        updateMandatoryExpensesList();
        updateTotalExpenses();
    }

    // Добавление новой обязательной траты
    addExpenseBtn.addEventListener('click', function() {
        mandatoryExpenses.push({ name: '', amount: 0 });
        updateMandatoryExpensesList();
        updateTotalExpenses();
    });

    // Обновление списка обязательных трат при загрузке страницы
    updateMandatoryExpensesList();

    // Новые элементы для отображения итогов
    const totalIncomeValue = document.getElementById('total-income-value');
    const totalExpensesValue = document.getElementById('total-expenses-value');

    // Функция для обновления итоговой суммы доходов
    function updateTotalIncome() {
        const totalIncome = getTotalIncome();
        totalIncomeValue.textContent = `Итого: ${formatNumber(totalIncome)} ₽`;
    }

    // Функция для обновления итоговой суммы расходов
    function updateTotalExpenses() {
        const totalIncome = getTotalIncome();
        const totalMandatoryExpenses = mandatoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalInvestments = Math.floor(totalIncome * (investmentPercentage / 100));
        const creditAmount = includeCreditsCheckbox.checked ? parseInt(creditAmountSlider.value, 10) : 0;
        const savingsAmount = includeSavingsCheckbox.checked ? parseInt(savingsAmountSlider.value, 10) : 0;
        const totalCushion = cushionAmount;
        const rentPayment = 15400;
        const minLivingExpenses = dailyMin * 30;

        const totalExpenses = totalMandatoryExpenses + totalInvestments + creditAmount + savingsAmount + totalCushion + rentPayment + minLivingExpenses;

        totalExpensesValue.textContent = `Итого: ${formatNumber(totalExpenses)} ₽`;
    }

    // Вызов функций при изменении зарплаты или остатка
    salaryInput.addEventListener('input', function() {
        formatInputNumber(event);
        showSettingsSection();
        saveSettings();
        updateTotalIncome();
        updateTotalExpenses();
    });
    previousBalanceInput.addEventListener('input', function() {
        formatInputNumber(event);
        showSettingsSection();
        saveSettings();
        updateTotalIncome();
        updateTotalExpenses();
    });

    function showSettingsSection() {
        const totalIncome = getTotalIncome();
        if (totalIncome > 10000) {
            settingsSection.classList.remove('hidden');
            setOptimalValues(totalIncome);
        } else {
            settingsSection.classList.add('hidden');
            resultsSection.classList.add('hidden');
        }
    }

    function getTotalIncome() {
        const salary = parseInt(salaryInput.value.replace(/\s/g, ''), 10) || 0;
        const previousBalance = parseInt(previousBalanceInput.value.replace(/\s/g, ''), 10) || 0;
        return salary + previousBalance;
    }

    // Устанавливаем оптимальные значения после ввода зарплаты
    function setOptimalValues(totalIncome) {
        // Выбор инвестиций
        selectOption(investmentOptions, '0'); // Стартовое значение 0%
        investmentPercentage = 0;

        // Выбор минимальных ежедневных расходов
        selectOption(dailyOptions, '1500');
        dailyMin = 1500;

        // Сумма на "подушку"
        selectOption(cushionOptions, '10000');
        cushionAmount = 10000;

        // Включаем оплату кредитных карт и устанавливаем значение
        includeCreditsCheckbox.checked = true;
        creditSettings.classList.remove('hidden');
        creditCardCount = 1;
        selectOption(creditCardOptions, '1');
        creditAmountSlider.min = 11000;
        creditAmountSlider.max = 100000;
        creditAmountSlider.value = 20000;
        creditAmountDisplay.textContent = formatNumber(parseInt(creditAmountSlider.value));

        // Включаем накопления и устанавливаем значение
        includeSavingsCheckbox.checked = true;
        savingsSettings.classList.remove('hidden');
        savingsAmountSlider.min = 0;
        savingsAmountSlider.max = 100000;
        savingsAmountSlider.value = 50000;
        savingsAmountDisplay.textContent = formatNumber(parseInt(savingsAmountSlider.value));

        adjustSliders();
    }

    // Функция для включения/отключения оплат кредитов
    function changeCheckBoxCredit() {
        if (includeCreditsCheckbox.checked) {
            creditSettings.classList.remove('hidden');
        } else {
            creditSettings.classList.add('hidden');
            creditAmountSlider.value = 0;
            creditAmountDisplay.textContent = '0 ₽';
            adjustSliders();
        }
    }

    function changeCheckBoxSaving() {
        if (includeSavingsCheckbox.checked) {
            savingsSettings.classList.remove('hidden');
        } else {
            savingsSettings.classList.add('hidden');
            savingsAmountSlider.value = 0;
            savingsAmountDisplay.textContent = '0 ₽';
            adjustSliders();
        }
    }

    // Вызов функции при изменении настроек бюджета
    function selectOption(options, value) {
        for (let btn of options) {
            btn.classList.remove('active');
            if (btn.dataset.value === value) {
                btn.classList.add('active');
            }
        }
    }

    // Обработчики для опций инвестиций
    for (let btn of investmentOptions) {
        btn.addEventListener('click', function() {
            selectOption(investmentOptions, btn.dataset.value);
            investmentPercentage = parseInt(btn.dataset.value);
            updateInvestmentAmountDisplay();
            adjustSliders();
            saveSettings();
            updateTotalExpenses(); // Обновление итоговой суммы расходов
        });
    }

 for (let btn of dailyOptions) {
        btn.addEventListener('click', function() {
            selectOption(dailyOptions, btn.dataset.value);
            dailyMin = parseInt(btn.dataset.value);
            adjustSliders();
            saveSettings();
            updateTotalExpenses(); // Обновление итоговой суммы расходов
        });
    }

    for (let btn of cushionOptions) {
        btn.addEventListener('click', function() {
            selectOption(cushionOptions, btn.dataset.value);
            cushionAmount = parseInt(btn.dataset.value);
            adjustSliders();
            saveSettings();
            updateTotalExpenses(); // Обновление итоговой суммы расходов
        });
    }

    // Для кредитных карт
    for (let btn of creditCardOptions) {
        btn.addEventListener('click', function() {
            selectOption(creditCardOptions, btn.dataset.value);
            creditCardCount = parseInt(btn.dataset.value);
            saveSettings();
            updateTotalExpenses(); // Обновление итоговой суммы расходов
        });
    }

    // Обработчики для включения/отключения оплат кредитов
    includeCreditsCheckbox.addEventListener('change', function() {
        changeCheckBoxCredit();
        updateTotalExpenses();
        saveSettings();
    });

    // Обработчики для включения/отключения накоплений
    includeSavingsCheckbox.addEventListener('change', function() {
        changeCheckBoxSaving();
        updateTotalExpenses();
        saveSettings();
    });

    // Для слайдеров
    creditAmountSlider.addEventListener('input', function() {
        creditAmountDisplay.textContent = `Сумма: ${formatNumber(parseInt(creditAmountSlider.value))} ₽`;
        adjustSliders();
        saveSettings();
        updateTotalExpenses(); // Обновление итоговой суммы расходов
    });

    savingsAmountSlider.addEventListener('input', function() {
        savingsAmountDisplay.textContent = `Сумма: ${formatNumber(parseInt(savingsAmountSlider.value))} ₽`;
        adjustSliders();
        saveSettings();
        updateTotalExpenses(); // Обновление итоговой суммы расходов
    });

    // Для кнопок Max
    creditMaxBtn.addEventListener('click', function() {
        creditAmountSlider.value = calculateMaxCreditAmount();
        creditAmountDisplay.textContent = `Сумма: ${formatNumber(parseInt(creditAmountSlider.value))} ₽`;
        adjustSliders();
        saveSettings();
        updateTotalExpenses(); // Обновление итоговой суммы расходов
    });

    savingsMaxBtn.addEventListener('click', function() {
        savingsAmountSlider.value = calculateMaxSavingsAmount();
        savingsAmountDisplay.textContent = `Сумма: ${formatNumber(parseInt(savingsAmountSlider.value))} ₽`;
        adjustSliders();
        saveSettings();
        updateTotalExpenses(); // Обновление итоговой суммы расходов
    });

    // Функция для расчёта доступных средств
    function calculateAvailableFunds() {
        const totalIncome = getTotalIncome();
        let remainingAmount = totalIncome;

        // Вычитаем обязательные траты
        let totalMandatoryExpenses = mandatoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        remainingAmount -= totalMandatoryExpenses;

        // Вычитаем сумму на "подушку"
        remainingAmount -= cushionAmount;

        // Инвестиции
        const totalInvestments = Math.floor(totalIncome * (investmentPercentage / 100));
        remainingAmount -= totalInvestments;

        // Оплата квартиры
        remainingAmount -= 15400;

        // Минимальные ежедневные расходы
        const requiredLivingExpenses = dailyMin * 30;
        remainingAmount -= requiredLivingExpenses;

        return remainingAmount;
    }

    // Функция для расчёта максимальной суммы на кредитные карты
    function calculateMaxCreditAmount() {
        const maxAvailable = calculateAvailableFunds() - parseInt(savingsAmountSlider.value || 0, 10);
        return Math.max(11000, Math.floor(maxAvailable / 1000) * 1000);
    }

    // Функция для расчёта максимальной суммы на накопления
    function calculateMaxSavingsAmount() {
        const maxAvailable = calculateAvailableFunds() - parseInt(creditAmountSlider.value || 0, 10);
        return Math.max(0, Math.floor(maxAvailable / 1000) * 1000);
    }

    // Функция для корректировки слайдеров
    function adjustSliders() {
        const availableFunds = calculateAvailableFunds();

        // Ограничиваем суммы на слайдерах
        const maxCreditAmount = calculateMaxCreditAmount();
        creditAmountSlider.max = maxCreditAmount;
        if (parseInt(creditAmountSlider.value, 10) > maxCreditAmount) {
            creditAmountSlider.value = maxCreditAmount;
            creditAmountDisplay.textContent = `Сумма: ${formatNumber(maxCreditAmount)} ₽`;
        }

        const maxSavingsAmount = calculateMaxSavingsAmount();
        savingsAmountSlider.max = maxSavingsAmount;
        if (parseInt(savingsAmountSlider.value, 10) > maxSavingsAmount) {
            savingsAmountSlider.value = maxSavingsAmount;
            savingsAmountDisplay.textContent = `Сумма: ${formatNumber(maxSavingsAmount)} ₽`;
        }
    }

    function saveSettings () {
        // Сохраняем настройки в localStorage
        const settings = {
            includeCredits: includeCreditsCheckbox.checked,
            creditAmount: creditAmountSlider.value,
            includeSavings: includeSavingsCheckbox.checked,
            savingsAmount: savingsAmountSlider.value,
            investmentPercentage: investmentPercentage,
            dailyMin: dailyMin,
            cushionAmount: cushionAmount,
            salary: parseInt(salaryInput.value.replace(/\s/g, ''), 10) || 0,
            previousBalance: parseInt(previousBalanceInput.value.replace(/\s/g, ''), 10) || 0,
            creditCardCount: creditCardCount
        };
        localStorage.setItem('budgetSettings', JSON.stringify(settings));
    }

    // Функция для расчёта и отображения бюджета
    function calculateBudget() {
        const totalIncome = getTotalIncome();
        let remainingAmount = totalIncome;

        // Вычитаем обязательные траты
        let totalMandatoryExpenses = mandatoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        remainingAmount -= totalMandatoryExpenses;

        // Вычитаем сумму на "подушку"
        remainingAmount -= cushionAmount;

        // Инвестиции
        const totalInvestments = Math.floor(totalIncome * (investmentPercentage / 100));
        remainingAmount -= totalInvestments;

        // Оплата квартиры
        remainingAmount -= 15400;

        // Оплата кредитных карт
        let creditAmount = includeCreditsCheckbox.checked ? parseInt(creditAmountSlider.value, 10) : 0;
        remainingAmount -= creditAmount;

        // Накопления на покупку квартиры
        let savingsAmount = includeSavingsCheckbox.checked ? parseInt(savingsAmountSlider.value, 10) : 0;
        remainingAmount -= savingsAmount;

        // Проверяем минимальные ежедневные расходы
        const minLivingExpenses = dailyMin * 30;

        // Если остаток меньше минимальных ежедневных расходов, пытаемся скорректировать другие расходы
        if (remainingAmount < minLivingExpenses) {
            let deficit = minLivingExpenses - remainingAmount;

            // Попытаемся уменьшить накопления
            if (includeSavingsCheckbox.checked && savingsAmount > 0) {
                let reduction = Math.min(deficit, savingsAmount);
                savingsAmount -= reduction;
                savingsAmountSlider.value = savingsAmount;
                savingsAmountDisplay.textContent = `Сумма: ${formatNumber(savingsAmount)} ₽`;
                remainingAmount += reduction;
                deficit -= reduction;
            }

            // Попытаемся уменьшить оплату кредитов
            if (deficit > 0 && includeCreditsCheckbox.checked && creditAmount > 11000) {
                let reduction = Math.min(deficit, creditAmount - 11000);
                creditAmount -= reduction;
                creditAmountSlider.value = creditAmount;
                creditAmountDisplay.textContent = `Сумма: ${formatNumber(creditAmount)} ₽`;
                remainingAmount += reduction;
                deficit -= reduction;
            }

            // Если всё ещё не хватает
            if (deficit > 0) {
                alert('Недостаточно средств для обеспечения минимальных ежедневных расходов. Пожалуйста, скорректируйте бюджет.');
                return;
            }
        }

        // Если остаток больше минимальных ежедневных расходов, распределяем остаток на ежедневные расходы
        let livingExpenses = remainingAmount;

        // Отображаем результаты
        resultsSection.classList.remove('hidden');

        // Краткий обзор результатов
        const resultsOverview = document.getElementById('results-overview');
        resultsOverview.innerHTML = '';

        const overviewItems = [
            { label: 'Зарплата', value: `${formatNumber(parseInt(salaryInput.value.replace(/\s/g, ''), 10)) || 0} ₽` },
            { label: 'Остаток с прошлого месяца', value: `${formatNumber(parseInt(previousBalanceInput.value.replace(/\s/g, ''), 10)) || 0} ₽` },
            { label: 'Общий доход', value: `${formatNumber(totalIncome)} ₽` },
            { label: 'Общие расходы', value: `${formatNumber(totalIncome - remainingAmount - livingExpenses)} ₽` },
            { label: 'Остаток на ежедневные расходы', value: `${formatNumber(livingExpenses)} ₽` },
            { label: 'Это примерно', value: `${formatNumber(Math.floor(livingExpenses / 30))} ₽/день` },
        ];

        overviewItems.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('result-item');
            div.innerHTML = `<span>${item.label}:</span><span>${item.value}</span>`;
            resultsOverview.appendChild(div);
        });

        // Подробные результаты
        const detailedResults = document.getElementById('detailed-results');
        detailedResults.innerHTML = '';

        // Обязательные траты
        if (totalMandatoryExpenses > 0) {
            const div = document.createElement('div');
            div.classList.add('detailed-item');
            div.innerHTML = `<h3>Обязательные траты: ${formatNumber(totalMandatoryExpenses)} ₽</h3>`;
            const ul = document.createElement('ul');
            mandatoryExpenses.forEach(expense => {
                const li = document.createElement('li');
                li.innerHTML = `${expense.name}: <span>${formatNumber(expense.amount)} ₽</span>`;
                ul.appendChild(li);
            });
            div.appendChild(ul);
            detailedResults.appendChild(div);
        }

        // Инвестиции
        if (totalInvestments > 0) {
            const div = document.createElement('div');
            div.classList.add('detailed-item');
            div.innerHTML = `<h3>Инвестиции: ${formatNumber(totalInvestments)} ₽</h3>`;
            // Распределение инвестиций можно добавить здесь
            detailedResults.appendChild(div);
        }

        // Оплата кредитных карт
        if (includeCreditsCheckbox.checked && creditAmount > 0) {
            const div = document.createElement('div');
            div.classList.add('detailed-item');
            div.innerHTML = `<h3>Оплата кредитных карт: ${formatNumber(creditAmount)} ₽</h3>`;
            const ul = document.createElement('ul');
            for (let i = 1; i <= creditCardCount; i++) {
                const li = document.createElement('li');
                li.innerHTML = `Кредитная карта ${i}: <span>${formatNumber(Math.floor(creditAmount / creditCardCount))} ₽</span>`;
                ul.appendChild(li);
            }
            div.appendChild(ul);
            detailedResults.appendChild(div);
        }

        // Накопления
        if (includeSavingsCheckbox.checked && savingsAmount > 0) {
            const div = document.createElement('div');
            div.classList.add('detailed-item');
            div.innerHTML = `<h3>Накопления на покупку квартиры: ${formatNumber(savingsAmount)} ₽</h3>`;
            detailedResults.appendChild(div);
        }

        // Оплата квартиры
        const rentDiv = document.createElement('div');
        rentDiv.classList.add('detailed-item');
        rentDiv.innerHTML = `<h3>Оплата квартиры: 15 400 ₽</h3>`;
        detailedResults.appendChild(rentDiv);

        // Сумма на "подушку"
        if (cushionAmount > 0) {
            const div = document.createElement('div');
            div.classList.add('detailed-item');
            div.innerHTML = `<h3>Сумма на "подушку": ${formatNumber(cushionAmount)} ₽</h3>`;
            detailedResults.appendChild(div);
        }
        saveSettings();
    }

    calculateBtn.addEventListener('click', calculateBudget);

    // Обновление отображения суммы инвестиций
    function updateInvestmentAmountDisplay() {
        const totalIncome = getTotalIncome();
        const investmentAmount = Math.floor(totalIncome * (investmentPercentage / 100));
        const investmentDisplay = document.getElementById('investment-total');
        investmentDisplay.textContent = `Сумма: ${formatNumber(investmentAmount)} ₽`;
    }

   // При загрузке настроек
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('budgetSettings'));
        if (settings) {
            includeCreditsCheckbox.checked = settings.includeCredits;
            creditAmountSlider.value = settings.creditAmount;
            creditAmountDisplay.textContent = `Сумма: ${formatNumber(parseInt(settings.creditAmount, 10))} ₽`;

            includeSavingsCheckbox.checked = settings.includeSavings;
            savingsAmountSlider.value = settings.savingsAmount;
            savingsAmountDisplay.textContent = `Сумма: ${formatNumber(parseInt(settings.savingsAmount, 10))} ₽`;

            selectOption(investmentOptions, settings.investmentPercentage.toString());
            investmentPercentage = settings.investmentPercentage;
            updateInvestmentAmountDisplay();

            selectOption(dailyOptions, settings.dailyMin.toString());
            dailyMin = settings.dailyMin;

            cushionAmount = settings.cushionAmount;
            selectOption(cushionOptions, cushionAmount.toString());

            salaryInput.value = formatNumber(settings.salary);
            previousBalanceInput.value = formatNumber(settings.previousBalance);

            selectOption(creditCardOptions, settings.creditCardCount.toString());
            creditCardCount = settings.creditCardCount;

            if (settings.salary + settings.previousBalance > 10000) {
                settingsSection.classList.remove('hidden');
            }

            if (!settings.includeCredits) {
                creditSettings.classList.add('hidden');
            }

            if (!settings.includeSavings) {
                savingsSettings.classList.add('hidden');
            }

            adjustSliders();
        }

        changeCheckBoxSaving();
        changeCheckBoxCredit();
        updateInvestmentAmountDisplay();
        updateTotalIncome();    // Добавьте вызов для обновления итогового дохода
        updateTotalExpenses();  // Добавьте вызов для обновления итоговых расходов
    }

    updateMandatoryExpensesList();

    // Форматирование чисел при вводе для зарплаты и остатка
    const salaryInputField = document.getElementById('salary-input');
    const previousBalanceInputField = document.getElementById('previous-balance-input');

    function formatInputNumber(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        if (value) {
            value = parseInt(value, 10).toLocaleString('ru-RU');
            input.value = value;
        } else {
            input.value = '';
        }
    }

    salaryInputField.addEventListener('input', formatInputNumber);
    previousBalanceInputField.addEventListener('input', formatInputNumber);

    loadSettings();
});
