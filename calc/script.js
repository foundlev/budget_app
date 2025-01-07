document.addEventListener('DOMContentLoaded', function() {
    // Получение элементов ввода
    const salaryInput = document.getElementById('salary-input');
    const previousBalanceInput = document.getElementById('previous-balance-input');
    const settingsSection = document.getElementById('settings-section');

    // Оплата кредитных карт
    const includeCreditsCheckbox = document.getElementById('include-credits');
    const creditSettings = document.getElementById('credit-settings');
    const creditMaxBtn = document.getElementById('credit-max-btn');
    const creditAmountInput = document.getElementById('credit-amount-input');
    const creditIncreaseBtn = document.getElementById('credit-increase-btn');
    const creditDecreaseBtn = document.getElementById('credit-decrease-btn');

    // Накопления на покупку квартиры
    const includeSavingsCheckbox = document.getElementById('include-savings');
    const savingsSettings = document.getElementById('savings-settings');
    const savingsMaxBtn = document.getElementById('savings-max-btn');
    const savingsAmountInput = document.getElementById('savings-amount-input');
    const savingsIncreaseBtn = document.getElementById('savings-increase-btn');
    const savingsDecreaseBtn = document.getElementById('savings-decrease-btn');

    // Процент на инвестиции и минимальные ежедневные расходы
    const investmentOptions = document.getElementById('investment-options').getElementsByClassName('option-button');
    const dailyOptions = document.getElementById('daily-options').getElementsByClassName('option-button');

    // Сумма на "подушку"
    const cushionOptions = document.getElementById('cushion-options').getElementsByClassName('option-button');

    // Обязательные траты
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const copyExpensesBtn = document.getElementById('copy-expenses-btn');
    const mandatoryExpensesList = document.getElementById('mandatory-expenses-list');
    const daysOptions = document.getElementById('days-options').getElementsByClassName('option-button');

    // Инициализация обязательных трат из localStorage
    let mandatoryExpenses = JSON.parse(localStorage.getItem('mandatoryExpenses')) || [];
    let investments = JSON.parse(localStorage.getItem('investments')) || [];

    // Начальные значения
    let investmentPercentage = 0; // Стартовое значение 0%
    let dailyMin = 1500;
    let cushionAmount = 10000;
    let selectedDays = 30;
    let creditCardCount = 1;
    let investmentRelativeValue = null;

    // Отображение блоков настроек при загрузке
    if (includeCreditsCheckbox.checked) {
        creditSettings.classList.remove('hidden');
    }

    if (includeSavingsCheckbox.checked) {
        savingsSettings.classList.remove('hidden');
    }

    // Пытаемся получить сохраненный пароль
    function getSavedPassword() {
        const password = localStorage.getItem('budgetAppPassword');
        return password;
    }

    // Если пароль отсутствует, показываем системное окно для запроса пароля
    if (!getSavedPassword()) {
        const password = prompt('Введите пароль для доступа к приложению:', '');
        if (password) {
            localStorage.setItem('budgetAppPassword', password);
        }
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
        if (currency === 'USD') {
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
        USD: 1,
        USDT: 1,
        USDT_TO_RUB: 95.8,
        BTC: 63093,
        MDL: 0.057,
        TON: 5.29,
        ETH: 2461
    };

    function copyTextToClipboard() {
        const tempText = this.textContent;
        this.innerHTML = `<i class="fas fa-check"></i>`;
        setTimeout(() => {
            this.innerHTML = tempText;
        }, 1000);
        navigator.clipboard.writeText(tempText);
    }

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

    // Функция для умного округления.
    function smartRound(value) {
        if (value >= 1000) {
            // Округляем в большую сторону
            return Math.ceil(value);
        } else if (1000 > value && value >= 10) {
            // Округляем до десятых
            return Math.round(value * 10) / 10;
        } else if (10 > value && value >= 1) {
            // Округляем до сотых
            return Math.round(value * 100) / 100;
        } else if (1 > value && value >= 0.01) {
            // Округляем до тысячных
            return Math.round(value * 1000) / 1000;
        } else {
            return Math.round(value * 1000000) / 1000000;
        }
    }

    // Функция для получения курсов валют с сервера.
    async function fetchCurrencies(password) {
        const url = ``;

        // Устанавливаем таймаут на 7 секунд
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        try {
            // Выполнение запроса с указанным таймаутом
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
            });

            // Проверяем успешный ли статус ответа
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Преобразуем ответ в JSON
            const jsonData = await response.json();
            const data = jsonData.data;

            let result = {
                "rates": {},
                "lastUpdated": jsonData.timestamp
            };

            if (data.USDT_USD) {
                result["rates"]["USD"] = (1 / data.USDT_USD.rate);
                result["rates"]["USDT"] = (data.USDT_USD.rate);
            }

            if (data.USDT_RUB) {
                result["rates"]["USDT_TO_RUB"] = (data.USDT_RUB.rate);
            }

            if (data.BTC) {
                result["rates"]["BTC"] = (data.BTC.rate);
            }

            if (data.USDT_MDL) {
                result["rates"]["MDL"] = (1 / data.USDT_MDL.rate);
            }

            if (data.TON) {
                result["rates"]["TON"] = (data.TON.rate);
            }

            if (data.ETH) {
                result["rates"]["ETH"] = (data.ETH.rate);
            }

            return result;

        } catch (error) {
            // В случае ошибки возвращаем пустой объект
            console.error('Fetch error: ', error);
            return {};
        } finally {
            // Очищаем таймаут
            clearTimeout(timeoutId);
        }
    }

    function convertTimestampToISO(timestamp) {
        // Преобразуем timestamp из секунд в миллисекунды
        const date = new Date(timestamp * 1000);
        return date.toISOString();
    }

    // Функция для сохранения курсов в localStorage
    function saveExchangeRates(rates, lastUpdated) {
        localStorage.setItem('exchangeRates', JSON.stringify(rates));
        localStorage.setItem('exchangeRatesLastUpdated', convertTimestampToISO(lastUpdated));
    }

    // Функция-заглушка для обновления курсов
    async function updateExchangeRates() {
        refreshRatesButton.textContent = '...';
        const result = await fetchCurrencies(getSavedPassword());

        const newRates = result.rates;
        const lastUpdated = result.lastUpdated;

        saveExchangeRates(newRates, lastUpdated);
        displayExchangeRates();
        refreshRatesButton.textContent = 'Обновить';
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
                text.textContent = `USDT: ${formatNumber(smartRound(usdtToRub))} RUB`;
            } else if (currency === 'USDT_TO_RUB') {
                text.textContent = `USDT: ${formatNumber(smartRound(rates[currency]))} RUB`;
            } else {
                text.textContent = `${currency}: ${formatNumber(smartRound(rates[currency]))} USDT`;
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
    const refreshRatesButton = document.getElementById('refresh-rates-btn');
    refreshRatesButton.addEventListener('click', async () => {
        await updateExchangeRates();
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

        if (isNaN(multiplier) || multiplier < 0 || multiplier > 20) {
            // Корректируем значение
            if (isNaN(multiplier) || multiplier < 0) {
                multiplier = 1.00;
            } else if (multiplier > 20) {
                multiplier = 20.00;
            }
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
            multiplierInput.value = expense.multiplier >= 0 ? formatMultiplier(expense.multiplier) : 'x1.00';
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

    // Копирование списка обязательных трат
    copyExpensesBtn.addEventListener('click', function() {
        // Получаем элемент с id copy-expenses-btn и тэгом i
        const copyExpensesBtn = document.getElementById('copy-expenses-btn');
        const i = copyExpensesBtn.querySelector('i');

        // На 1 секунду убираем из класса fa-clone и добавляем fa-check, затем возвращаем обратно к fa-clone
        i.classList.remove('fa-clone');
        i.classList.add('fa-check');
        setTimeout(() => {
            i.classList.remove('fa-check');
            i.classList.add('fa-clone');
        }, 1000);

        // Создаем список словарей обязательных трат
        const copiedExpenses = mandatoryExpenses.map(expense => ({
            name: expense.name,
            amount: expense.amount,
            multiplier: parseFloat(expense.multiplier) || 0,
            currency: expense.currency,
            totalCostRub: calculateExpenseTotal(expense)
        }));

        // Копируем в буфер обмена
        const jsonString = JSON.stringify(copiedExpenses);
        navigator.clipboard.writeText(jsonString);
    });

    // Функция для расчета итоговой стоимости траты
    function calculateExpenseTotal(expense) {
        let multiplier = parseFloat(expense.multiplier);
        if (isNaN(multiplier)) {
            multiplier = 1;
        }
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
        updateTotalsSection();
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
        updateInvestmentPercentageColors();
        updateTotalExpenses();
    }

    function updateInvestmentsTotal() {
        const totalIncome = getTotalIncome();
        const totalInvestments = investments.reduce((sum, investment) => {
            return sum + calculateInvestmentAmount(investment, totalIncome);
        }, 0);

        document.getElementById('investments-total').textContent = `Сумма: ${formatNumber(totalInvestments)} ₽`;
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

        localStorage.setItem('investments', JSON.stringify(investments));
        updateTotalExpenses();
        updateInvestmentAmountDisplay();

        // Вызываем функцию для обновления цвета полей ввода
        updateInvestmentPercentageColors();
        updateInvestmentsList();
    }

    function updateInvestmentsList() {
        const investmentsList = document.getElementById('investments-list');
        investmentsList.innerHTML = '';

        // Считаем общую сумму процентов в словаре investments
        let percentSum = 0;
        investments.forEach(inv => percentSum += inv.percentage || 0);

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
            percentageInput.placeholder = Math.floor(100 - percentSum) + '%';
            percentageInput.dataset.index = index;
            percentageInput.classList.add('investment-percentage-input');

            if (percentSum > 100) {
                percentageInput.classList.add('red');
            } else if (percentSum < 100) {
                percentageInput.classList.add('blue');
            }

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
        updateInvestmentPercentageColors();
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
        const totalAmount = Math.floor(dailyMin * selectedDays);
        document.getElementById('min-daily-amount').textContent = `Сумма: ${formatNumber(totalAmount)} ₽`;
    }

    function showSettingsSection() {
        const totalIncome = getTotalIncome();
        if (totalIncome > 10000) {
            settingsSection.classList.remove('hidden');
            setOptimalValues(totalIncome);
        } else {
            settingsSection.classList.add('hidden');
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
        updateMinDailyAmountDisplay();

        // Сумма на "подушку"
        selectOption(cushionOptions, '10000');
        cushionAmount = 10000;

        // Включаем оплату кредитных карт и устанавливаем значение
        includeCreditsCheckbox.checked = true;
        creditSettings.classList.remove('hidden');
        creditAmountInput.value = formatNumber(20000) + ' ₽';

        // Включаем накопления и устанавливаем значение
        includeSavingsCheckbox.checked = true;
        savingsSettings.classList.remove('hidden');
        savingsAmountInput.value = formatNumber(50000) + ' ₽';

        adjustAmounts();
    }

    // Функция для включения/отключения оплат кредитов
    function changeCheckBoxCredit() {
        if (includeCreditsCheckbox.checked) {
            creditSettings.classList.remove('hidden');
        } else {
            creditSettings.classList.add('hidden');
            creditAmountInput.value = '0 ₽';
            adjustAmounts();
        }
    }

    function changeCheckBoxSaving() {
        if (includeSavingsCheckbox.checked) {
            savingsSettings.classList.remove('hidden');
        } else {
            savingsSettings.classList.add('hidden');
            savingsAmountInput.value = '0 ₽';
            adjustAmounts();
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
            adjustAmounts();
            updateInvestmentsList();
            updateTotalExpenses(); // Обновление итоговой суммы расходов
            saveSettings();
        });
    }

    // Обработчики для опций количества дней
    for (let btn of daysOptions) {
        btn.addEventListener('click', function() {
            selectOption(daysOptions, btn.dataset.value);
            selectedDays = parseInt(btn.dataset.value);
            updateMinDailyAmountDisplay();
            adjustAmounts();
            saveSettings();
            updateTotalExpenses();
        });
    }

    // Обработчики для опций минимальных ежедневных расходов
    for (let btn of dailyOptions) {
        btn.addEventListener('click', function() {
            selectOption(dailyOptions, btn.dataset.value);
            dailyMin = parseInt(btn.dataset.value);
            updateMinDailyAmountDisplay();
            adjustAmounts();
            saveSettings();
            updateTotalExpenses();
        });
    }

    for (let btn of cushionOptions) {
        btn.addEventListener('click', function() {
            selectOption(cushionOptions, btn.dataset.value);
            cushionAmount = parseInt(btn.dataset.value);
            adjustAmounts();
            saveSettings();
            updateTotalExpenses();
        });
    }

    // Обработчики для включения/отключения оплат кредитов
    includeCreditsCheckbox.addEventListener('change', function() {
        changeCheckBoxCredit();
        updateTotalExpenses();
        adjustAmounts();
        saveSettings();
    });

    // Обработчики для включения/отключения накоплений
    includeSavingsCheckbox.addEventListener('change', function() {
        changeCheckBoxSaving();
        updateTotalExpenses();
        adjustAmounts();
        saveSettings();
    });

    // Обработчики для кнопок изменения суммы кредитов
    creditIncreaseBtn.addEventListener('click', function() {
        changeCreditAmount(1000);
        adjustAmounts();
    });

    creditDecreaseBtn.addEventListener('click', function() {
        changeCreditAmount(-1000);
        adjustAmounts();
    });

    creditMaxBtn.addEventListener('click', function() {
        setCreditAmountToMax();
        adjustAmounts();
    });

    // Обработчики для кнопок изменения суммы накоплений
    savingsIncreaseBtn.addEventListener('click', function() {
        changeSavingsAmount(1000);
        adjustAmounts();
    });

    savingsDecreaseBtn.addEventListener('click', function() {
        changeSavingsAmount(-1000);
        adjustAmounts();
    });

    savingsMaxBtn.addEventListener('click', function() {
        setSavingsAmountToMax();
        adjustAmounts();
    });

    function changeCreditAmount(delta) {
        let amount = parseInt(creditAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        amount += delta;
        if (amount < 0) amount = 0;
        const maxAmount = calculateMaxCreditAmount();
        if (amount > maxAmount) amount = maxAmount;
        creditAmountInput.value = formatNumber(amount) + ' ₽';
        saveSettings();
        updateTotalExpenses();
    }

    function setCreditAmountToMax() {
        const maxAmount = calculateMaxCreditAmount();
        creditAmountInput.value = formatNumber(maxAmount) + ' ₽';
        saveSettings();
        updateTotalExpenses();
    }

    function changeSavingsAmount(delta) {
        let amount = parseInt(savingsAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        amount += delta;
        if (amount < 0) amount = 0;
        const maxAmount = calculateMaxSavingsAmount();
        if (amount > maxAmount) amount = maxAmount;
        savingsAmountInput.value = formatNumber(amount) + ' ₽';
        saveSettings();
        updateTotalExpenses();
    }

    function setSavingsAmountToMax() {
        const maxAmount = calculateMaxSavingsAmount();
        savingsAmountInput.value = formatNumber(maxAmount) + ' ₽';
        saveSettings();
        updateTotalExpenses();
    }

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
        const requiredLivingExpenses = dailyMin * selectedDays;
        remainingAmount -= requiredLivingExpenses;

        return remainingAmount;
    }

    // Функция для расчёта максимальной суммы на кредитные карты
    function calculateMaxCreditAmount() {
        const savingsAmount = parseInt(savingsAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        const maxAvailable = calculateAvailableFunds() - savingsAmount;
        return Math.max(0, Math.floor(maxAvailable / 1000) * 1000);
    }

    // Функция для расчёта максимальной суммы на накопления
    function calculateMaxSavingsAmount() {
        const creditAmount = parseInt(creditAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        const maxAvailable = calculateAvailableFunds() - creditAmount;
        return Math.max(0, Math.floor(maxAvailable / 1000) * 1000);
    }

    // Функция для корректировки сумм
    function adjustAmounts() {
        // Для кредитных карт
        let maxCreditAmount = calculateMaxCreditAmount();
        creditMaxBtn.textContent = `MAX ${formatNumber(maxCreditAmount)} ₽`;

        let currentCreditAmount = parseInt(creditAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        if (currentCreditAmount > maxCreditAmount) {
            currentCreditAmount = maxCreditAmount;
            creditAmountInput.value = formatNumber(currentCreditAmount) + ' ₽';
        }

        // Для накоплений
        let maxSavingsAmount = calculateMaxSavingsAmount();
        savingsMaxBtn.textContent = `MAX ${formatNumber(maxSavingsAmount)} ₽`;

        let currentSavingsAmount = parseInt(savingsAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0;
        if (currentSavingsAmount > maxSavingsAmount) {
            currentSavingsAmount = maxSavingsAmount;
            savingsAmountInput.value = formatNumber(currentSavingsAmount) + ' ₽';
        }

        saveSettings();
    }

    function saveSettings () {
        // Сохраняем настройки в localStorage
        const settings = {
            includeCredits: includeCreditsCheckbox.checked,
            creditAmount: parseInt(creditAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0,
            includeSavings: includeSavingsCheckbox.checked,
            savingsAmount: parseInt(savingsAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0,
            investmentPercentage: investmentPercentage,
            dailyMin: dailyMin,
            cushionAmount: cushionAmount,
            salary: parseInt(salaryInput.value.replace(/\s/g, ''), 10) || 0,
            previousBalance: parseInt(previousBalanceInput.value.replace(/\s/g, ''), 10) || 0,
            selectedDays: selectedDays
        };
        localStorage.setItem('budgetSettings', JSON.stringify(settings));
        localStorage.setItem('investments', JSON.stringify(investments));
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
            selectedDays = settings.selectedDays;

            includeCreditsCheckbox.checked = settings.includeCredits;
            creditAmountInput.value = formatAmount(parseInt(settings.creditAmount, 10) || 0);

            includeSavingsCheckbox.checked = settings.includeSavings;
            savingsAmountInput.value = formatAmount(parseInt(settings.savingsAmount, 10) || 0);

            selectOption(investmentOptions, settings.investmentPercentage.toString());
            investmentPercentage = settings.investmentPercentage;
            updateInvestmentAmountDisplay();

            selectOption(dailyOptions, settings.dailyMin.toString());
            dailyMin = settings.dailyMin;
            updateMinDailyAmountDisplay();

            cushionAmount = settings.cushionAmount;
            selectOption(cushionOptions, cushionAmount.toString());

            salaryInput.value = formatNumber(settings.salary) + ' ₽';
            previousBalanceInput.value = formatNumber(settings.previousBalance) + ' ₽';

            // Загрузка обязательных трат с множителями
            mandatoryExpenses = JSON.parse(localStorage.getItem('mandatoryExpenses')) || [];
            updateMandatoryExpensesList();

            adjustAmounts();

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

        selectedDays = settings ? settings.selectedDays : 30;
        selectOption(daysOptions, selectedDays.toString());
        updateMinDailyAmountDisplay();

        adjustAmounts();

        saveSettings();
    }

    // Форматирование чисел при вводе для зарплаты и остатка
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

    salaryInput.addEventListener('input', formatInputNumber);
    previousBalanceInput.addEventListener('input', formatInputNumber);

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
        const creditAmount = includeCreditsCheckbox.checked ? parseInt(creditAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0 : 0;

        // Накопления
        const savingsAmount = includeSavingsCheckbox.checked ? parseInt(savingsAmountInput.value.replace(/[^0-9]/g, ''), 10) || 0 : 0;

        // Минимальные ежедневные расходы
        const minAmountDaily = dailyMin;
        const days = selectedDays;
        const estAmountTotal = Math.round(minAmountDaily * days);

        // actPlanExpensesTotal
        const actPlanExpensesTotal = creditAmount + totalCushion + totalInvestmentAmount + savingsAmount + totalMandatoryExpenses;

        // actAmountTotal
        const actAmountTotal = previousBalance + salary - actPlanExpensesTotal;

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
                savings: savingsAmount,
                actPlanExpensesTotal: actPlanExpensesTotal
            },
            minAmountDaily: minAmountDaily,
            days: days,
            estAmountTotal: estAmountTotal,
            actAmountTotal: actAmountTotal
        };
    }

    function updateTotalsSection() {
        const totalsSection = document.getElementById('totals-section');
        totalsSection.innerHTML = ''; // Очищаем содержимое

        const totalData = calculateTotal();

        // Переменные для удобства
        const creditAmount = totalData.out.creditPayments;
        const savingsAmount = totalData.out.savings;
        const cushionAmount = totalData.out.cushion;
        const mandatoryExpenses = totalData.out.mandatoryExpenses;
        const investmentAmount = totalData.out.investments;
        const remainingLivingExpenses = totalData.actAmountTotal;
        const perDay = remainingLivingExpenses >= 0 ? Math.floor(remainingLivingExpenses / totalData.days) : 0;

        // 1. Оплата кредитных карт
        if (creditAmount > 0) {

            const creditItem = document.createElement('div');
            creditItem.classList.add('total-item');

            const label = document.createElement('label');
            label.textContent = `Оплата кредитных карт: ${formatAmount(creditAmount)}`;
            label.classList.add('label-flex');

            const select = document.createElement('select');
            select.classList.add('styled-select');

            for (let i = 1; i <= 4; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i} карт(ы)`;
                select.appendChild(option);
            }

            // Устанавливаем у выпадающего списка значение из текущих настроек
            select.value = creditCardCount;

            select.addEventListener('change', function() {
                creditCardCount = parseInt(this.value);
                updateTotalsSection();
            });

            const perCardAmount = Math.floor(creditAmount / creditCardCount);
            const amountSpan = document.createElement('span');
            amountSpan.classList.add('per-card-amount');
            amountSpan.textContent = `${perCardAmount}`;
            amountSpan.classList.add('monospace-field');

            amountSpan.addEventListener('click', copyTextToClipboard)

            creditItem.appendChild(label);
            creditItem.appendChild(select);
            creditItem.appendChild(amountSpan);

            totalsSection.appendChild(creditItem);
        }

        // 2. Накопления на покупку квартиры
        if (savingsAmount > 0) {
            const savingsItem = document.createElement('div');
            savingsItem.classList.add('total-item');

            const label = document.createElement('label');
            label.textContent = 'Отложить на квартиру:';

            const amountSpan = document.createElement('span');
            amountSpan.textContent = `${savingsAmount}`;
            amountSpan.classList.add('monospace-field');

            amountSpan.addEventListener('click', copyTextToClipboard)

            savingsItem.appendChild(label);
            savingsItem.appendChild(amountSpan);

            totalsSection.appendChild(savingsItem);
        }

        // 3. Подушка безопасности
        if (cushionAmount > 0) {
            const cushionItem = document.createElement('div');
            cushionItem.classList.add('total-item');

            const label = document.createElement('label');
            label.textContent = 'Отложить на подушку:';

            const amountSpan = document.createElement('span');
            amountSpan.textContent = `${cushionAmount}`;
            amountSpan.classList.add('monospace-field');

            amountSpan.addEventListener('click', copyTextToClipboard)

            cushionItem.appendChild(label);
            cushionItem.appendChild(amountSpan);

            totalsSection.appendChild(cushionItem);
        }

        // 4. Обязательные траты
        if (mandatoryExpenses > 0) {
            const mandatoryItem = document.createElement('div');
            mandatoryItem.classList.add('total-item');

            const label = document.createElement('label');
            label.textContent = 'Обязательные траты:';

            const amountSpan = document.createElement('span');
            amountSpan.textContent = `${mandatoryExpenses}`;
            amountSpan.classList.add('monospace-field');

            amountSpan.addEventListener('click', copyTextToClipboard)

            mandatoryItem.appendChild(label);
            mandatoryItem.appendChild(amountSpan);

            totalsSection.appendChild(mandatoryItem);
        }

        // 5. Инвестиции
        if (investmentAmount > 0 || investments.length > 0) {
            const investmentItem = document.createElement('div');
            investmentItem.classList.add('total-item');

            const label = document.createElement('label');
            label.textContent = `Инвестиции: ${formatAmount(investmentAmount)}`;
            label.id = 'investment-label';

            // Переводим сумму инвестиций из RUB в USDT
            rates = loadExchangeRates();
            if (investmentRelativeValue === null) {
                investmentRelativeValue = smartRound(investmentAmount / rates.USDT_TO_RUB);
            }

            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'investment-input';
            input.value = investmentRelativeValue || 0;

            input.addEventListener('blur', function(event) {
                investmentRelativeValue = Math.abs(this.value);
                console.log(investmentRelativeValue);
                updateTotalsSection();
            });

            investmentItem.appendChild(label);
            investmentItem.appendChild(input);

            totalsSection.appendChild(investmentItem);

            // Распределение между направлениями
            investments.forEach((inv) => {
                const invItem = document.createElement('div');
                invItem.classList.add('total-item');

                const invLabel = document.createElement('label');
                invLabel.textContent = `${inv.name || 'Без названия'} (${inv.percentage || 0}%)`;

                const invAmount = smartRound((investmentRelativeValue * (inv.percentage / 100)) || 0);
                const invSpan = document.createElement('span');
                invSpan.textContent = `${invAmount}`;
                invSpan.classList.add('monospace-field');

                invSpan.addEventListener('click', copyTextToClipboard);

                invItem.appendChild(invLabel);
                invItem.appendChild(invSpan);

                totalsSection.appendChild(invItem);
            });
        }

        // 6. Остаток на проживание и расход в день (дублирование)
        const remainingItem = document.createElement('div');
        remainingItem.classList.add('total-item');

        const label = document.createElement('label');
        label.textContent = 'Остаток на проживание:';

        const amountSpan = document.createElement('span');
        amountSpan.textContent = `${formatNumber(remainingLivingExpenses)} ₽ (${formatNumber(perDay)} ₽/день)`;

        remainingItem.appendChild(label);
        remainingItem.appendChild(amountSpan);

        totalsSection.appendChild(remainingItem);
    }

    loadSettings();
});
