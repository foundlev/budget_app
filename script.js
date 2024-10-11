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
    const daysOptions = document.getElementById('days-options').getElementsByClassName('option-button');


    // Инициализация обязательных трат из localStorage
    let mandatoryExpenses = JSON.parse(localStorage.getItem('mandatoryExpenses')) || [];
    let investments = JSON.parse(localStorage.getItem('investments')) || [];

    // Начальные значения
    let investmentPercentage = 0; // Стартовое значение 0%
    let dailyMin = 1500;
    let cushionAmount = 10000;
    let creditCardCount = 1;
    let selectedDays = 30;

    // Отображение блоков настроек при загрузке
    if (includeCreditsCheckbox.checked) {
        creditSettings.classList.remove('hidden');
    }

    if (includeSavingsCheckbox.checked) {
        savingsSettings.classList.remove('hidden');
    }

    // Функция форматирования чисел с разделением тысяч
    function formatNumber(number) {
        return number.toLocaleString('ru-RU').replace(',', '.');
    }

    function formatNumberInput(value) {
        value = value.toString().replace(',', '.');
        const parts = value.split('.');
        parts[0] = parseInt(parts[0], 10).toLocaleString('ru-RU');
        return parts.join('.');
    }

    // Функция форматирования суммы с символом рубля
    function formatAmount(value, currency = 'RUB') {
        if (currency === 'USD' || currency === 'USDT') {
            return '$' + formatNumber(value);
        } else if (currency === 'RUB') {
            return formatNumber(value) + ' ₽';
        } else {
            return formatNumber(value) + ' ' + currency;
        }
    }

    // Функция форматирования множителя с 'x' перед числом
    function formatMultiplier(value) {
        return 'x' + parseFloat(value).toFixed(2);
    }

    // Предустановленные курсы валют
    const defaultExchangeRates = {
        USDT: 1,
        USDT_TO_RUB: 75,
        USD: 1,
        BTC: 30000,
        MDL: 0.057,
        TON: 2,
        ETH: 2000
    };

    // Функция для загрузки курсов из localStorage или использования предустановленных
    function loadExchangeRates() {
        let rates = JSON.parse(localStorage.getItem('exchangeRates'));
        if (!rates) {
            rates = defaultExchangeRates;
            document.getElementById('default-warning').classList.remove('hidden');
        } else {
            document.getElementById('default-warning').classList.add('hidden');
        }
        return rates;
    }

    // Функция для сохранения курсов в localStorage
    function saveExchangeRates(rates) {
        localStorage.setItem('exchangeRates', JSON.stringify(rates));
        localStorage.setItem('exchangeRatesLastUpdated', new Date().toISOString());
    }

    // Функция-заглушка для обновления курсов
    function updateExchangeRates() {
        // Здесь можно сделать реальный запрос к API
        const newRates = defaultExchangeRates; // Пока возвращаем предустановленные значения
        saveExchangeRates(newRates);
        displayExchangeRates();
    }

    // Функция для отображения курсов на странице
    function displayExchangeRates() {
        const rates = loadExchangeRates();
        const ratesList = document.getElementById('exchange-rates-list');
        ratesList.innerHTML = ''; // Очищаем список

        // Создаем элементы для каждого курса
        for (let currency in rates) {
            if (currency === 'USDT') continue; // Пропускаем USDT
            const rateItem = document.createElement('div');
            rateItem.classList.add('exchange-rate');

            const icon = document.createElement('i');
            switch (currency) {
                case 'USD':
                    icon.classList.add('fas', 'fa-money-bill-alt');
                    break;
                case 'MDL':
                    icon.classList.add('fas', 'fa-money-bill');
                    break;
                case 'BTC':
                    icon.classList.add('fab', 'fa-btc');
                    break;
                case 'ETH':
                    icon.classList.add('fab', 'fa-ethereum');
                    break;
                case 'TON':
                    icon.classList.add('fas', 'fa-circle');
                    break;
                case 'USDT':
                    icon.classList.add('fas', 'fa-dollar-sign');
                    break;
                case 'USDT_TO_RUB':
                    icon.classList.add('fas', 'fa-dollar-sign');
                    break;
                default:
                    icon.classList.add('fas', 'fa-money-bill-alt');
            }

            const text = document.createElement('span');

            if (currency === 'USDT') {
                const usdtToRub = rates['USDT_TO_RUB'] || 75; // Предполагаемый курс USDT к RUB
                text.textContent = `USDT: ${formatNumber(usdtToRub)} RUB`;
            } else if (currency === 'USDT_TO_RUB') {
                text.textContent = `USDT: ${formatNumber(rates[currency])} RUB`;
            } else {
                text.textContent = `${currency}: ${formatNumber(rates[currency])} USDT`;
            }

            rateItem.appendChild(icon);
            rateItem.appendChild(text);
            ratesList.appendChild(rateItem);
        }

        // Обновляем время последнего обновления
        const lastUpdated = localStorage.getItem('exchangeRatesLastUpdated');
        if (lastUpdated) {
            const lastUpdatedDate = new Date(lastUpdated);
            const now = new Date();
            const diffMs = now - lastUpdatedDate;
            const diffMinutes = Math.floor(diffMs / 60000);

            let timeAgoText = '';

            if (diffMinutes < 1) {
                timeAgoText = 'менее 1 минуты назад';
            } else if (diffMinutes < 60) {
                timeAgoText = `${diffMinutes} мин. назад`;
            } else if (diffMinutes < 1440) { // менее 24 часов
                const hours = Math.floor(diffMinutes / 60);
                const minutes = diffMinutes % 60;
                timeAgoText = `${hours} ч. ${minutes} мин. назад`;
            } else {
                const days = Math.floor(diffMinutes / 1440);
                const hours = Math.floor((diffMinutes % 1440) / 60);
                timeAgoText = `${days} дн. ${hours} ч. назад`;
            }

            document.getElementById('last-updated').textContent = `Обновлено: ${timeAgoText}`;
        } else {
            document.getElementById('last-updated').textContent = 'Обновлено: неизвестно';
        }
    }

    // Обработчик нажатия на кнопку "Обновить"
    document.getElementById('refresh-rates-btn').addEventListener('click', () => {
        updateExchangeRates();
    });

    // Вызов отображения курсов при загрузке страницы
    displayExchangeRates();

    // Функция обработки ввода суммы
    function onAmountInput(event) {
        const input = event.target;
        const index = input.dataset.index;
        const currency = mandatoryExpenses[index].currency || 'RUB';
        let value = input.value.replace(/[^0-9.,]/g, '').replace(',', '.');

        if (currency === 'RUB') {
            // Для RUB оставляем только целые числа
            value = value.replace(/\..*$/, '');
        }

        input.value = value;
    }

    // Функция форматирования суммы при уходе из поля ввода
    function formatAmountInput(event) {
        const index = event.target.dataset.index;
        let value = event.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
        let amount = parseFloat(value) || 0;
        const currency = mandatoryExpenses[index].currency || 'RUB';

        if (currency === 'RUB') {
            amount = Math.round(amount);
        }

        mandatoryExpenses[index].amount = amount;

        // Используем formatNumberInput вместо formatAmount
        event.target.value = amount > 0 ? formatNumberInput(amount) : '';
        updateTotalExpenses(); // Обновление итоговой суммы расходов
        localStorage.setItem('mandatoryExpenses', JSON.stringify(mandatoryExpenses));

        // Обновляем итоговую стоимость
        updateExpenseTotalCost(index);
    }

    // Функция обработки ввода множителя
    function onMultiplierInput(event) {
        const input = event.target;
        // Удаляем все, кроме цифр, точки и запятой
        let value = input.value.replace(/[^0-9.,]/g, '').replace(',', '.');
        input.value = value;
        input.classList.remove('invalid');
    }

    function formatMultiplierInput(event) {
        const index = event.target.dataset.index;
        let rawValue = event.target.value.replace(',', '.');
        let multiplier = parseFloat(rawValue);

        if (isNaN(multiplier) || multiplier <= 0 || multiplier > 20) {
            // Выделяем поле красным
            event.target.classList.add('invalid');
            // Корректируем значение
            if (isNaN(multiplier) || multiplier <= 0) {
                multiplier = 1.00;
            } else if (multiplier > 20) {
                multiplier = 20.00;
            }
        } else {
            // Убираем выделение
            event.target.classList.remove('invalid');
        }

        // Обновляем значение множителя
        mandatoryExpenses[index].multiplier = multiplier;

        // Обновляем отображение
        event.target.value = formatMultiplier(multiplier);

        // Сохраняем в localStorage
        localStorage.setItem('mandatoryExpenses', JSON.stringify(mandatoryExpenses));

        updateTotalExpenses(); // Обновление итоговой суммы расходов

        // Обновляем итоговую стоимость
        updateExpenseTotalCost(index);
    }

    // Функция для обработки изменения валюты
    function onCurrencyChange(event) {
        const index = event.target.dataset.index;
        mandatoryExpenses[index].currency = event.target.value;
        localStorage.setItem('mandatoryExpenses', JSON.stringify(mandatoryExpenses));
        updateMandatoryExpensesList();
        updateTotalExpenses();
    }

    // Функция для обновления итоговой стоимости траты
    function updateExpenseTotalCost(index) {
        const expense = mandatoryExpenses[index];
        const totalCost = calculateExpenseTotal(expense);
        const totalCostInput = document.querySelector(`.total-cost-input[data-index="${index}"]`);
        totalCostInput.value = formatAmount(totalCost, 'RUB');
    }

    // Обновленная функция updateMandatoryExpensesList
    function updateMandatoryExpensesList() {
        mandatoryExpensesList.innerHTML = '';
        mandatoryExpenses.forEach((expense, index) => {
            const expenseItem = document.createElement('div');
            expenseItem.classList.add('mandatory-expense-item');

            // Поле для отображения итоговой стоимости
            const totalCostInput = document.createElement('input');
            totalCostInput.type = 'text';
            totalCostInput.value = formatAmount(calculateExpenseTotal(expense), 'RUB');
            totalCostInput.disabled = true;
            totalCostInput.classList.add('total-cost-input');
            totalCostInput.dataset.index = index;

            const expenseNameInput = document.createElement('input');
            expenseNameInput.type = 'text';
            expenseNameInput.value = expense.name;
            expenseNameInput.placeholder = 'Название';
            expenseNameInput.dataset.index = index;
            expenseNameInput.addEventListener('input', updateExpenseName);

            // Создаем обертку для селекта
            const currencySelectWrapper = document.createElement('div');
            currencySelectWrapper.classList.add('currency-select-wrapper');

            // Создание выпадающего списка для выбора валюты
            const currencySelect = document.createElement('select');
            currencySelect.classList.add('currency-select');
            currencySelect.dataset.index = index;

            // Добавляем селект в обертку
            currencySelectWrapper.appendChild(currencySelect);

            const currencies = ['RUB', 'USD', 'USDT', 'MDL', 'BTC', 'ETH', 'TON'];
            currencies.forEach(curr => {
                const option = document.createElement('option');
                option.value = curr;
                option.textContent = curr;
                currencySelect.appendChild(option);
            });

            // Устанавливаем выбранную валюту
            currencySelect.value = expense.currency || 'RUB';

            // Обработчик изменения валюты
            currencySelect.addEventListener('change', onCurrencyChange);

            const expenseAmountInput = document.createElement('input');
            expenseAmountInput.type = 'text';
            expenseAmountInput.value = expense.amount > 0 ? formatNumberInput(expense.amount) : '';
            expenseAmountInput.placeholder = 'Сумма';
            expenseAmountInput.min = '0';
            expenseAmountInput.dataset.index = index;
            expenseAmountInput.addEventListener('input', onAmountInput);
            expenseAmountInput.addEventListener('blur', formatAmountInput);

            // Создание поля ввода для множителя
            const multiplierInput = document.createElement('input');
            multiplierInput.type = 'text';
            multiplierInput.value = expense.multiplier ? formatMultiplier(expense.multiplier) : 'x1.00';
            multiplierInput.placeholder = 'Множитель';
            multiplierInput.classList.add('multiplier-input');
            multiplierInput.dataset.index = index;
            multiplierInput.addEventListener('input', onMultiplierInput);
            multiplierInput.addEventListener('blur', formatMultiplierInput);

            // Создание кнопки удаления
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            removeBtn.dataset.index = index;
            removeBtn.addEventListener('click', removeExpense);

            // Добавляем элементы в траты в правильном порядке
            expenseItem.appendChild(expenseNameInput);
            expenseItem.appendChild(expenseAmountInput);
            expenseItem.appendChild(currencySelectWrapper);
            expenseItem.appendChild(multiplierInput);
            expenseItem.appendChild(totalCostInput);
            expenseItem.appendChild(removeBtn);

            // Добавляем элемент траты в список
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

    // Удаление траты
    function removeExpense(event) {
        const index = event.currentTarget.dataset.index; // Используем event.currentTarget
        mandatoryExpenses.splice(index, 1);
        updateMandatoryExpensesList();
        updateTotalExpenses();
    }

    // Добавление новой обязательной траты
    addExpenseBtn.addEventListener('click', function() {
        mandatoryExpenses.push({ name: '', amount: 0, multiplier: '1.00', currency: 'RUB' });
        updateMandatoryExpensesList();
        updateTotalExpenses();
    });

    // Функция для расчета итоговой стоимости траты
    function calculateExpenseTotal(expense) {
        const multiplier = parseFloat(expense.multiplier) || 1;
        const amount = parseFloat(expense.amount) || 0;

        let total;
        if (expense.currency === 'RUB' || !expense.currency) {
            total = amount * multiplier;
        } else {
            const rates = loadExchangeRates();
            const usdtToRub = rates['USDT_TO_RUB'] || 75; // Курс USDT к RUB
            const currencyToUsdt = rates[expense.currency] || 1; // Курс выбранной валюты к USDT
            total = amount * multiplier * usdtToRub * currencyToUsdt;
        }

        return Math.ceil(total); // Округляем в большую сторону до целого числа
    }

    // Обновление функции updateTotalExpenses
    function updateTotalExpenses() {
        const totalData = calculateTotal();

        // Обновляем отображение общей суммы расходов
        totalExpensesValue.textContent = `Итого: ${formatNumber(totalData.out.actPlanExpensesTotal)} ₽`;

        // Рассчитываем остаток на проживание
        const remainingLivingExpenses = totalData.actAmountTotal;
        const perDay = remainingLivingExpenses >= 0 ? Math.floor(remainingLivingExpenses / totalData.days) : 0;

        const remainingLivingExpensesValue = document.getElementById('remaining-living-expenses-value');
        remainingLivingExpensesValue.textContent = `${formatNumber(remainingLivingExpenses)} ₽ (${formatNumber(perDay)} ₽/день)`;

        // Добавляем проверку
        if (perDay < totalData.minAmountDaily) {
            remainingLivingExpensesValue.classList.add('warning-text');
        } else {
            remainingLivingExpensesValue.classList.remove('warning-text');
        }

        // Обновляем отображение общей суммы обязательных трат
        document.getElementById('mandatory-expenses-total').textContent = `Сумма: ${formatNumber(totalData.out.mandatoryExpenses)} ₽`;
    }

    // Новые элементы для отображения итогов
    const totalIncomeValue = document.getElementById('total-income-value');
    const totalExpensesValue = document.getElementById('total-expenses-value');

    // Функция для обновления итоговой суммы доходов
    function updateTotalIncome() {
        const totalIncome = getTotalIncome();
        totalIncomeValue.textContent = `Итого: ${formatNumber(totalIncome)} ₽`;
    }

    function calculateInvestmentAmount(investment) {
        const totalIncome = getTotalIncome();
        const totalInvestmentAmount = Math.floor(totalIncome * (investmentPercentage / 100));
        return Math.floor(totalInvestmentAmount * (investment.percentage / 100));
    }

    function removeInvestment(index) {
        investments.splice(index, 1);
        updateInvestmentsList();
        updateInvestmentPercentageColors(); // Добавляем вызов здесь
        updateTotalExpenses();
    }

    function updateInvestmentsTotal() {
        const totalIncome = getTotalIncome();
        const totalInvestments = investments.reduce((sum, investment) => {
            return sum + calculateInvestmentAmount(investment, totalIncome);
        }, 0);

        document.getElementById('investments-total').textContent = `Сумма: ${formatNumber(totalInvestments)} ₽`;
    }

    function updateSliderTicks(slider, datalistId) {
        const datalist = document.getElementById(datalistId);
        datalist.innerHTML = ''; // Очищаем существующие метки

        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const range = max - min;

        if (range <= 0) return;

        const step = Math.floor(range / 5 / 1000) * 1000;
        if (step <= 0) return;

        for (let i = min; i <= max; i += step) {
            const option = document.createElement('option');
            option.value = i;
            datalist.appendChild(option);
        }

        // Убедимся, что максимальное значение включено
        if (max % step !== 0) {
            const option = document.createElement('option');
            option.value = max;
            datalist.appendChild(option);
        }
    }

    function updateInvestmentName(event) {
        const index = event.target.dataset.index;
        investments[index].name = event.target.value;
        localStorage.setItem('investments', JSON.stringify(investments));
    }

    function onInvestmentPercentageInput(event) {
        const input = event.target;
        let value = input.value.replace(/[^0-9]/g, '');
        input.value = value;
    }

    function formatInvestmentPercentageInput(event) {
        const index = event.target.dataset.index;
        let percentage = parseInt(event.target.value.replace(/[^0-9]/g, ''), 10) || 0;

        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        investments[index].percentage = percentage;
        event.target.value = percentage + '%';

        // Проверяем сумму процентов
        const totalDirectionPercentage = investments.reduce((sum, inv) => sum + (inv.percentage || 0), 0);

        if (totalDirectionPercentage > 100) {
            alert('Сумма процентов инвестиционных направлений не должна превышать 100%');
            investments[index].percentage = 0;
            event.target.value = '0%';
        }

        localStorage.setItem('investments', JSON.stringify(investments));
        updateTotalExpenses();
        updateInvestmentAmountDisplay();

        // Вызываем функцию для обновления цвета полей ввода
        updateInvestmentPercentageColors();
    }

    function updateInvestmentsList() {
        const investmentsList = document.getElementById('investments-list');
        investmentsList.innerHTML = '';
        investments.forEach((investment, index) => {
            const investmentItem = document.createElement('div');
            investmentItem.classList.add('investment-item');

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = investment.name;
            nameInput.placeholder = 'Название';
            nameInput.dataset.index = index;
            nameInput.addEventListener('input', updateInvestmentName);

            const percentageInput = document.createElement('input');
            percentageInput.type = 'text';
            percentageInput.value = investment.percentage > 0 ? investment.percentage + '%' : '';
            percentageInput.placeholder = '%';
            percentageInput.dataset.index = index;
            percentageInput.classList.add('investment-percentage-input');
            percentageInput.addEventListener('input', onInvestmentPercentageInput);
            percentageInput.addEventListener('blur', formatInvestmentPercentageInput);

            // Расчёт суммы для направления
            const amountInput = document.createElement('input');
            amountInput.type = 'text';
            amountInput.value = formatAmount(calculateInvestmentAmount(investment), 'RUB');
            amountInput.disabled = true;

            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            removeBtn.dataset.index = index;
            removeBtn.addEventListener('click', () => {
                removeInvestment(index);
            });

            investmentItem.appendChild(nameInput);
            investmentItem.appendChild(percentageInput);
            investmentItem.appendChild(amountInput);
            investmentItem.appendChild(removeBtn);

            investmentsList.appendChild(investmentItem);
        });

        localStorage.setItem('investments', JSON.stringify(investments));
        // Обновляем отображение общей суммы инвестиций
        updateInvestmentAmountDisplay();
    }

    function updateInvestmentPercentageColors() {
        const totalPercentage = investments.reduce((sum, inv) => sum + (inv.percentage || 0), 0);
        investments.forEach((investment, index) => {
            const percentageInput = document.querySelector(`.investment-percentage-input[data-index="${index}"]`);
            if (!percentageInput) return;

            percentageInput.classList.remove('red', 'blue');

            if (totalPercentage < 100) {
                percentageInput.classList.add('blue');
            } else if (totalPercentage > 100) {
                percentageInput.classList.add('red');
            }
        });
    }

    function addInvestment() {
        investments.push({ name: '', percentage: 0 });
        updateInvestmentsList();
        updateInvestmentPercentageColors(); // Добавляем вызов здесь
        updateTotalExpenses();
    }

    document.getElementById('add-investment-btn').addEventListener('click', addInvestment);

    // Вызов функций при изменении зарплаты или остатка
    salaryInput.addEventListener('input', function(event) {
        formatInputNumber(event);
        showSettingsSection();
        saveSettings();
        updateTotalIncome();
        updateTotalExpenses();
    });

    previousBalanceInput.addEventListener('input', function(event) {
        formatInputNumber(event);
        showSettingsSection();
        saveSettings();
        updateTotalIncome();
        updateTotalExpenses();
    });

    function updateMinDailyAmountDisplay() {
        document.getElementById('min-daily-amount').textContent = `Сумма: ${formatNumber(Math.floor(dailyMin * selectedDays))} ₽`;
    }

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
        const salary = parseInt(salaryInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        const previousBalance = parseInt(previousBalanceInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        return salary + previousBalance;
    }

    // Устанавливаем оптимальные значения после ввода зарплаты
    function setOptimalValues(totalIncome) {
        // Выбор инвестиций
        selectOption(investmentOptions, '0'); // Стартовое значение 0%
        investmentPercentage = 0;

        // Выбор минимальных ежедневных расходов
        selectOption(dailyOptions, '1500');
        document.getElementById('min-daily-amount').textContent = `Сумма: ${formatNumber(Math.floor(dailyMin * 30))} ₽`;
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
        creditAmountDisplay.textContent = `На оплату кредитных карт: ${formatNumber(parseInt(creditAmountSlider.value))}`;

        // Включаем накопления и устанавливаем значение
        includeSavingsCheckbox.checked = true;
        savingsSettings.classList.remove('hidden');
        savingsAmountSlider.min = 0;
        savingsAmountSlider.max = 100000;
        savingsAmountSlider.value = 50000;
        savingsAmountDisplay.textContent = `Сумма на накопления: ${formatNumber(parseInt(savingsAmountSlider.value))}`;

        adjustSliders();
    }

    // Функция для включения/отключения оплат кредитов
    function changeCheckBoxCredit() {
        if (includeCreditsCheckbox.checked) {
            creditSettings.classList.remove('hidden');
        } else {
            creditSettings.classList.add('hidden');
            creditAmountSlider.value = 0;
            creditAmountDisplay.textContent = 'На оплату кредитных карт: 0 ₽';
            adjustSliders();
        }
    }

    function changeCheckBoxSaving() {
        if (includeSavingsCheckbox.checked) {
            savingsSettings.classList.remove('hidden');
        } else {
            savingsSettings.classList.add('hidden');
            savingsAmountSlider.value = 0;
            savingsAmountDisplay.textContent = 'Сумма на накопления: 0 ₽';
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

    for (let btn of daysOptions) {
        btn.addEventListener('click', function() {
            selectOption(daysOptions, btn.dataset.value);
            selectedDays = parseInt(btn.dataset.value);
            updateMinDailyAmountDisplay();
            adjustSliders();
            saveSettings();
            updateTotalExpenses();
        });
    }

    for (let btn of dailyOptions) {
        btn.addEventListener('click', function() {
            selectOption(dailyOptions, btn.dataset.value);
            dailyMin = parseInt(btn.dataset.value);
            document.getElementById('min-daily-amount').textContent = `Сумма: ${formatNumber(Math.floor(dailyMin * 30))} ₽`;
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
            updateTotalExpenses();
        });
    }

    // Для кредитных карт
    for (let btn of creditCardOptions) {
        btn.addEventListener('click', function() {
            selectOption(creditCardOptions, btn.dataset.value);
            creditCardCount = parseInt(btn.dataset.value);
            adjustSliders();
            saveSettings();
            updateTotalExpenses(); // Обновление итоговой суммы расходов
        });
    }

    // Обработчики для включения/отключения оплат кредитов
    includeCreditsCheckbox.addEventListener('change', function() {
        changeCheckBoxCredit();
        updateTotalExpenses();
        adjustSliders();
        saveSettings();
    });

    // Обработчики для включения/отключения накоплений
    includeSavingsCheckbox.addEventListener('change', function() {
        changeCheckBoxSaving();
        updateTotalExpenses();
        adjustSliders();
        saveSettings();
    });

    // Для слайдеров
    creditAmountSlider.addEventListener('input', function() {
        creditAmountDisplay.textContent = `На оплату кредитных карт: ${formatNumber(parseInt(creditAmountSlider.value))} ₽`;
        updateTotalExpenses();
        adjustSliders();
        saveSettings();
    });

    savingsAmountSlider.addEventListener('input', function() {
        savingsAmountDisplay.textContent = `Сумма на накопления: ${formatNumber(parseInt(savingsAmountSlider.value))} ₽`;
        updateTotalExpenses();
        adjustSliders();
        saveSettings();
    });

    // Для кнопок Max
    creditMaxBtn.addEventListener('click', function() {
        creditAmountSlider.value = creditAmountSlider.max;
        creditAmountDisplay.textContent = `На оплату кредитных карт: ${formatNumber(parseInt(creditAmountSlider.value))} ₽`;
        updateTotalExpenses();
        saveSettings();
    });

    savingsMaxBtn.addEventListener('click', function() {
        savingsAmountSlider.value = savingsAmountSlider.max;
        savingsAmountDisplay.textContent = `Сумма на накопления: ${formatNumber(parseInt(savingsAmountSlider.value))} ₽`;
        updateTotalExpenses();
        saveSettings();
    });

    // Функция для расчёта доступных средств
    function calculateAvailableFunds() {
        const totalIncome = getTotalIncome();
        let remainingAmount = totalIncome;

        // Вычитаем обязательные траты
        let totalMandatoryExpenses = mandatoryExpenses.reduce((sum, expense) => sum + calculateExpenseTotal(expense), 0);
        remainingAmount -= totalMandatoryExpenses;

        // Вычитаем сумму на "подушку"
        remainingAmount -= cushionAmount;

        // Инвестиции
        const totalInvestments = Math.floor(totalIncome * (investmentPercentage / 100));
        remainingAmount -= totalInvestments;

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
        const totalData = calculateTotal();

        // Общий доход
        const totalIncome = totalData.in.salary + totalData.in.previousBalance;

        // Общая сумма минимальных расходов на проживание
        const totalLiveAmount = totalData.estAmountTotal;

        // Для кредитных карт
        let maxCreditAmount = totalIncome - totalData.out.cushion - totalData.out.investments - totalData.out.mandatoryExpenses - totalData.out.savings - totalLiveAmount;
        maxCreditAmount = Math.max(0, Math.floor(maxCreditAmount / 1000) * 1000);

        creditAmountSlider.max = maxCreditAmount;
        creditAmountSlider.min = 0;
        creditAmountSlider.step = 1000;

        // Обновляем текст кнопки MAX
        creditMaxBtn.textContent = `MAX ${formatNumber(maxCreditAmount)} ₽`;

        if (parseInt(creditAmountSlider.value, 10) > maxCreditAmount) {
            creditAmountSlider.value = maxCreditAmount;
        }

        creditAmountDisplay.textContent = `На оплату кредитных карт: ${formatNumber(parseInt(creditAmountSlider.value, 10))} ₽`;

        // Для накоплений
        let maxSavingsAmount = totalIncome - totalData.out.creditPayments - totalData.out.investments - totalData.out.mandatoryExpenses - totalData.out.savings - totalLiveAmount;
        maxSavingsAmount = Math.max(0, Math.floor(maxSavingsAmount / 1000) * 1000);

        savingsAmountSlider.max = maxSavingsAmount;
        savingsAmountSlider.min = 0;
        savingsAmountSlider.step = 1000;

        // Обновляем текст кнопки MAX
        savingsMaxBtn.textContent = `MAX ${formatNumber(maxSavingsAmount)} ₽`;

        if (parseInt(savingsAmountSlider.value, 10) > maxSavingsAmount) {
            savingsAmountSlider.value = maxSavingsAmount;
        }

        savingsAmountDisplay.textContent = `Сумма на накопления: ${formatNumber(parseInt(savingsAmountSlider.value, 10))} ₽`;

        // Обновляем метки на слайдере кредитных карт
        updateSliderTicks(creditAmountSlider, 'credit-ticks');

        // Обновляем метки на слайдере накоплений
        updateSliderTicks(savingsAmountSlider, 'savings-ticks');

        // Сохраняем настройки
        saveSettings();
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
        localStorage.setItem('investments', JSON.stringify(investments));

        settings.selectedDays = selectedDays;
        localStorage.setItem('budgetSettings', JSON.stringify(settings));
    }

    // Обновление отображения суммы инвестиций
    function updateInvestmentAmountDisplay() {
        const totalIncome = getTotalIncome();
        const investmentAmount = Math.floor(totalIncome * (investmentPercentage / 100));
        const investmentDisplay = document.getElementById('investment-total');
        investmentDisplay.textContent = `Инвестиции: ${formatNumber(investmentAmount)} ₽`;
    }

    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('budgetSettings'));
        if (settings) {
            includeCreditsCheckbox.checked = settings.includeCredits;
            creditAmountSlider.value = settings.creditAmount;
            creditAmountDisplay.textContent = `На оплату кредитных карт: ${formatNumber(parseInt(settings.creditAmount, 10))} ₽`;

            includeSavingsCheckbox.checked = settings.includeSavings;
            savingsAmountSlider.value = settings.savingsAmount;
            savingsAmountDisplay.textContent = `Сумма на накопления: ${formatNumber(parseInt(settings.savingsAmount, 10))} ₽`;

            selectOption(investmentOptions, settings.investmentPercentage.toString());
            investmentPercentage = settings.investmentPercentage;
            updateInvestmentAmountDisplay();

            selectOption(dailyOptions, settings.dailyMin.toString());
            dailyMin = settings.dailyMin;
            document.getElementById('min-daily-amount').textContent = `Сумма: ${formatNumber(Math.floor(dailyMin * 30))} ₽`;

            cushionAmount = settings.cushionAmount;
            selectOption(cushionOptions, cushionAmount.toString());

            salaryInput.value = formatNumber(settings.salary) + ' ₽';
            previousBalanceInput.value = formatNumber(settings.previousBalance) + ' ₽';

            selectOption(creditCardOptions, settings.creditCardCount.toString());
            creditCardCount = settings.creditCardCount;

            // Загрузка обязательных трат с множителями
            mandatoryExpenses = JSON.parse(localStorage.getItem('mandatoryExpenses')) || [];
            updateMandatoryExpensesList();

            adjustSliders();

            if (settings.salary + settings.previousBalance > 10000) {
                settingsSection.classList.remove('hidden');
            }

            if (!settings.includeCredits) {
                creditSettings.classList.add('hidden');
            }

            if (!settings.includeSavings) {
                savingsSettings.classList.add('hidden');
            }
        }

        changeCheckBoxSaving();
        changeCheckBoxCredit();
        updateInvestmentAmountDisplay();
        updateTotalIncome();
        updateTotalExpenses();

        investments = JSON.parse(localStorage.getItem('investments')) || [];
        updateInvestmentsList();
        updateInvestmentPercentageColors();

        selectedDays = settings.selectedDays || 30;
        selectOption(daysOptions, selectedDays.toString());
        updateMinDailyAmountDisplay();
    }

    // Форматирование чисел при вводе для зарплаты и остатка
    const salaryInputField = document.getElementById('salary-input');
    const previousBalanceInputField = document.getElementById('previous-balance-input');

    function formatInputNumber(event) {
        const input = event.target;
        let value = input.value.replace(/\D/g, '');
        if (value) {
            value = parseInt(value, 10).toLocaleString('ru-RU');
            input.value = value + ' ₽';
        } else {
            input.value = '';
        }
    }

    salaryInputField.addEventListener('input', formatInputNumber);
    previousBalanceInputField.addEventListener('input', formatInputNumber);

    function calculateTotal() {
        const totalIncome = getTotalIncome();

        // Входящие суммы
        const salary = parseInt(salaryInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        const previousBalance = parseInt(previousBalanceInput.value.replace(/[^0-9]/g, ''), 10) || 0;

        // Обязательные траты
        const totalMandatoryExpenses = mandatoryExpenses.reduce((sum, expense) => {
            return sum + calculateExpenseTotal(expense);
        }, 0);

        // Сумма инвестиций
        const totalInvestmentAmount = Math.floor(totalIncome * (investmentPercentage / 100));

        // Подушка
        const totalCushion = cushionAmount;

        // Кредитные карты
        const creditAmount = includeCreditsCheckbox.checked ? parseInt(creditAmountSlider.value, 10) : 0;
        const creditCardCountValue = includeCreditsCheckbox.checked ? creditCardCount : 0;

        // Накопления
        const savingsAmount = includeSavingsCheckbox.checked ? parseInt(savingsAmountSlider.value, 10) : 0;

        // Минимальные ежедневные расходы
        const minAmountDaily = dailyMin;
        const days = selectedDays;
        const estAmountTotal = Math.round(minAmountDaily * days);

        // actPlanExpensesTotal
        const actPlanExpensesTotal = creditAmount + totalCushion + totalInvestmentAmount + savingsAmount + totalMandatoryExpenses;

        // actAmountTotal
        const actAmountTotal = previousBalance + salary - actPlanExpensesTotal;
//        console.log(actAmountTotal);

        return {
            in: {
                salary: salary,
                previousBalance: previousBalance
            },
            out: {
                mandatoryExpenses: totalMandatoryExpenses,
                investments: totalInvestmentAmount,
                cushion: totalCushion,
                creditPayments: creditAmount,
                creditCardCount: creditCardCountValue,
                savings: savingsAmount,
                actPlanExpensesTotal: actPlanExpensesTotal
            },
            minAmountDaily: minAmountDaily,
            days: days,
            estAmountTotal: estAmountTotal,
            actAmountTotal: actAmountTotal
        };
    }

    loadSettings();
    console.log(JSON.stringify(calculateTotal()));
});
