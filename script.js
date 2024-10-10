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
                    icon.classList.add('fas', 'fa-dollar-sign');
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
                    icon.classList.add('fas', 'fa-coins');
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
            } else {
                timeAgoText = `${diffMinutes} мин. назад`;
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
        const totalIncome = getTotalIncome();

        // Вычисляем сумму обязательных трат
        const totalMandatoryExpenses = mandatoryExpenses.reduce((sum, expense) => {
            return sum + calculateExpenseTotal(expense);
        }, 0);

        // Обновляем отображение общей суммы обязательных трат
        document.getElementById('mandatory-expenses-total').textContent = `Сумма: ${formatNumber(totalMandatoryExpenses)} ₽`;

        const totalInvestments = Math.floor(totalIncome * (investmentPercentage / 100));
        const creditAmount = includeCreditsCheckbox.checked ? parseInt(creditAmountSlider.value, 10) : 0;
        const savingsAmount = includeSavingsCheckbox.checked ? parseInt(savingsAmountSlider.value, 10) : 0;
        const totalCushion = cushionAmount;
        const minLivingExpenses = dailyMin * 30;

        // Запланированные расходы = обязательные траты + инвестиции + подушка + кредитные карты + накопления
        const totalExpenses = totalMandatoryExpenses + totalInvestments + creditAmount + savingsAmount + totalCushion + minLivingExpenses;

        const remainingAmount = Math.floor(totalIncome - totalExpenses);

        totalExpensesValue.textContent = `Итого: ${formatNumber(totalExpenses)} ₽`;

        // Рассчитываем остаток на проживание
        const remainingLivingExpenses = remainingAmount >= 0 ? remainingAmount : 0;
        const perDay = remainingLivingExpenses >= 0 ? Math.floor(remainingLivingExpenses / 30) : 0;

        document.getElementById('remaining-living-expenses-value').textContent = `${formatNumber(remainingLivingExpenses)} ₽ (${formatNumber(perDay)} ₽/день)`;
    }

    // Новые элементы для отображения итогов
    const totalIncomeValue = document.getElementById('total-income-value');
    const totalExpensesValue = document.getElementById('total-expenses-value');

    // Функция для обновления итоговой суммы доходов
    function updateTotalIncome() {
        const totalIncome = getTotalIncome();
        totalIncomeValue.textContent = `Итого: ${formatNumber(totalIncome)} ₽`;
    }

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
        creditAmountDisplay.textContent = `На оплату кредитных карт: ${formatNumber(parseInt(creditAmountSlider.value))} ₽`;
        adjustSliders();
        saveSettings();
        updateTotalExpenses(); // Обновление итоговой суммы расходов
    });

    savingsAmountSlider.addEventListener('input', function() {
        savingsAmountDisplay.textContent = `Сумма на накопления: ${formatNumber(parseInt(savingsAmountSlider.value))} ₽`;
        adjustSliders();
        saveSettings();
        updateTotalExpenses(); // Обновление итоговой суммы расходов
    });

    // Для кнопок Max
    creditMaxBtn.addEventListener('click', function() {
        creditAmountSlider.value = calculateMaxCreditAmount();
        creditAmountDisplay.textContent = `На оплату кредитных карт: ${formatNumber(parseInt(creditAmountSlider.value))} ₽`;
        adjustSliders();
        saveSettings();
        updateTotalExpenses(); // Обновление итоговой суммы расходов
    });

    savingsMaxBtn.addEventListener('click', function() {
        savingsAmountSlider.value = calculateMaxSavingsAmount();
        savingsAmountDisplay.textContent = `Сумма на накопления: ${formatNumber(parseInt(savingsAmountSlider.value))} ₽`;
        adjustSliders();
        saveSettings();
        updateTotalExpenses(); // Обновление итоговой суммы расходов
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
        const availableFunds = calculateAvailableFunds();

        // Ограничиваем суммы на слайдерах
        const maxCreditAmount = calculateMaxCreditAmount();
        creditAmountSlider.max = maxCreditAmount;
        if (parseInt(creditAmountSlider.value, 10) > maxCreditAmount) {
            creditAmountSlider.value = maxCreditAmount;
            creditAmountDisplay.textContent = `На оплату кредитных карт: ${formatNumber(maxCreditAmount)} ₽`;
        }

        const maxSavingsAmount = calculateMaxSavingsAmount();
        savingsAmountSlider.max = maxSavingsAmount;
        if (parseInt(savingsAmountSlider.value, 10) > maxSavingsAmount) {
            savingsAmountSlider.value = maxSavingsAmount;
            savingsAmountDisplay.textContent = `Сумма на накопления: ${formatNumber(maxSavingsAmount)} ₽`;
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

    // Обновление отображения суммы инвестиций
    function updateInvestmentAmountDisplay() {
        const totalIncome = getTotalIncome();
        const investmentAmount = Math.floor(totalIncome * (investmentPercentage / 100));
        const investmentDisplay = document.getElementById('investment-total');
        investmentDisplay.textContent = `Сумма: ${formatNumber(investmentAmount)} ₽`;
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

    loadSettings();
});
