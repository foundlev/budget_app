document.addEventListener('DOMContentLoaded', function() {
    const importExpenseBtn = document.getElementById('import-expense-btn');
    const expensesList = document.getElementById('mandatory-expenses-list');

    // Итоговая сумма расходов
    const totalExpensesDiv = document.getElementById('mandatory-expenses-total');

    //  Модальное окно импорта
    const importModal = document.getElementById('import-modal');

    // Кнопки модального окна импорта
    // Многострочное поле для ввода JSON
    const expenseInput = document.getElementById('expense-input');
    // Кнопки: Вставить, Добавить к JSON
    const pasteJsonBtn = document.getElementById('paste-json-btn');
    const addJsonBtn = document.getElementById('add-to-json-btn');
    // Кнопки: Загрузить из файла, Перезаписать в JSON
    const loadJsonBtn = document.getElementById('load-json-btn');
    const rewriteJsonBtn = document.getElementById('rewrite-json-btn');
    // Кнопка отмены
    const cancelBtn = document.getElementById('cancel-btn');

    let expenses = JSON.parse(localStorage.getItem('savedExpenses')) || [];

    function saveSettings() {
        localStorage.setItem('savedExpenses', JSON.stringify(expenses));
    }

    function isJsonValid(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        } catch (e) {
            return false;
        }
    }

    function makeJsonPretty(jsonString) {
        if (isJsonValid(jsonString)) {
            return JSON.stringify(JSON.parse(jsonString), null, 2);
        } else {
            return jsonString;
        }
    }

    function checkJsonKeysExistence(jsonData, keys) {
        // Проверяем, что json является списком.
        if (!Array.isArray(jsonData)) {
            return false;
        }
        // Проверяем, что все объекты в списке имеют все нужные ключи.
        let validFlag = true;
        jsonData.forEach(item => {
            const jsonDataKeys = Object.keys(item);
            if (!keys.every(key => jsonDataKeys.includes(key))) {
                validFlag = false;
            }
        })
        return validFlag;
    }

    function checkImportJson(jsonData) {
        if (!isJsonValid(jsonData)) {
            return false;
        }
        const requiredKeys = ['name', 'amount', 'multiplier', 'currency', 'totalCostRub'];
        return checkJsonKeysExistence(JSON.parse(jsonData), requiredKeys);
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

    function checkImportButtons() {
        // Проверяем валидность JSON
        const insertedData = expenseInput.value;
        if (checkImportJson(expenseInput.value)) {
            addJsonBtn.disabled = false;
            rewriteJsonBtn.disabled = false;
        } else {
            addJsonBtn.disabled = true;
            rewriteJsonBtn.disabled = true;
        }
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

    // Функция форматирования чисел с разделением тысяч
    function formatNumber(number) {
        return number.toLocaleString('ru-RU').replace(',', '.');
    }

    // Функция форматирования множителя с 'x' перед числом
    function formatMultiplier(value) {
        return 'x' + parseFloat(value).toFixed(2);
    }

    function updateExpensesList() {
        expensesList.innerHTML = '';
        let totalListCostRub = 0;
        expenses.forEach((expense, index) => {

            // Поле название
            const expenseName = document.createElement('input');
            expenseName.type = 'text';
            expenseName.value = expense.name;
            expenseName.placeholder = 'Название';
            expenseName.dataset.index = index;
            expenseName.disabled = true;

            // Поле стоимость за x1
            const expenseCost = document.createElement('input');
            expenseCost.type = 'text';
            expenseCost.value = formatAmount(expense.amount, expense.currency || 'RUB');
            expenseCost.placeholder = 'Стоимость';
            expenseCost.dataset.index = index;
            expenseCost.disabled = true;

            // Поле множитель
            const expenseMultiplier = document.createElement('input');
            expenseMultiplier.type = 'text';
            expenseMultiplier.value = formatMultiplier(expense.multiplier);
            expenseMultiplier.placeholder = 'Множитель';
            expenseMultiplier.dataset.index = index;
            expenseMultiplier.disabled = true;

            // Поле сумма
            const expenseTotal = document.createElement('input');
            expenseTotal.type = 'text';
            expenseTotal.value = formatAmount(expense.totalCostRub, 'RUB');
            expenseTotal.placeholder = 'Сумма';
            expenseTotal.dataset.index = index;
            expenseTotal.disabled = true;

            if (!expense.unused) {
                totalListCostRub += expense.totalCostRub;
            }

            // Создаем кнопки удаления
            const removeBtn = document.createElement('button');
            removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
            removeBtn.dataset.index = index;
            removeBtn.classList.add('icon-button');
            removeBtn.classList.add('danger-button');

            removeBtn.addEventListener('click', async function() {
                // Спрашиваем пользователя, уверен ли он, что хочет удалить эту запись
                const { value: userAnswer } = await Swal.fire({
                    title: 'Удалить расходы?',
                    text: 'Выбранная строка расходов будет удалена безвозвратно',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Удалить',
                    cancelButtonText: 'Отмена'
                });

                if (userAnswer) {
                    expenses = expenses.filter((_, i) => i!== parseInt(this.dataset.index));
                    updateExpensesList();
                    saveSettings();
                }

            });

            // Создаем кнопку для скрытия строки
            const hideBtn = document.createElement('button');
            hideBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            hideBtn.dataset.index = index;
            hideBtn.classList.add('icon-button');
            hideBtn.classList.add('hide-button');

            hideBtn.addEventListener('click', function() {
                // Устанавливаем расходам hidden = True
                expenses[parseInt(this.dataset.index)].unused = true;
                updateExpensesList();
                saveSettings();
            });

            // Создаем кнопку для показа скрытой строки
            const showBtn = document.createElement('button');
            showBtn.innerHTML = '<i class="fas fa-eye"></i>';
            showBtn.dataset.index = index;
            showBtn.classList.add('icon-button');
            showBtn.classList.add('hide-button');

            showBtn.addEventListener('click', function() {
                // Устанавливаем расходам hidden = False
                expenses[parseInt(this.dataset.index)].unused = false;
                updateExpensesList();
                saveSettings();
            });

            // Создаем кнопку для уменьшения количества на единицу.
            const decreaseBtn = document.createElement('button');
            decreaseBtn.innerHTML = '<i class="fas fa-minus-square"></i>';
            decreaseBtn.dataset.index = index;
            decreaseBtn.classList.add('icon-button');
            decreaseBtn.classList.add('decrease-button');

            decreaseBtn.addEventListener('click', async function() {
                // Проверяем, что множитель больше или равен 2
                if (expense.multiplier >= 2) {
                    // Спрашиваем пользователя, уверен ли он, что хочет уменьшить на единицу через sw
                    const { value: userAnswer } = await Swal.fire({
                        title: 'Уменьшить на единицу?',
                        text: 'Вы уверены, что хотите уменьшить трату на единицу? Итоговая сумма будет изменена автоматически.',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Уменьшить',
                        cancelButtonText: 'Отмена'
                    });

                    if (userAnswer) {
                        // Вычисляем стоимость на x1 в RUB
                        costPerOne = expense.totalCostRub / expense.multiplier;
                        expense.multiplier--;
                        expense.totalCostRub = smartRound(costPerOne * expense.multiplier);
                        updateExpensesList();
                        saveSettings();
                    }
                } else {
                    // Показываем предупреждение, что множитель не может быть меньше 2 для его уменьшения
                    Swal.fire({
                        title: 'Уменьшение невозможно',
                        text: 'Множитель не может быть меньше 2 для его уменьшения.',
                        icon: 'warning',
                        confirmButtonText: 'Ок'
                    });
                }
            });

            if (expense.unused) {
                hideBtn.classList.add('hidden');
            } else {
                showBtn.classList.add('hidden');
            }

            const expenseItem = document.createElement('div');
            expenseItem.classList.add('mandatory-expense-item');
            if (expense.unused) {
                expenseItem.classList.add('unused');
            }

            expenseItem.appendChild(hideBtn);
            expenseItem.appendChild(showBtn);
            expenseItem.appendChild(decreaseBtn);
            expenseItem.appendChild(expenseName);
            expenseItem.appendChild(expenseCost);
            expenseItem.appendChild(expenseMultiplier);
            expenseItem.appendChild(expenseTotal);
            expenseItem.appendChild(removeBtn);

            expensesList.appendChild(expenseItem);
        });

        totalExpensesDiv.textContent = `Итого: ${formatAmount(smartRound(totalListCostRub), 'RUB')}`;
    }

    // Открытие модального окна
    importExpenseBtn.addEventListener('click', async function() {
        importModal.style.display = 'flex'
    });

    pasteJsonBtn.addEventListener('click', async function() {
        // Получаем данные из буферма обмена в переменную
        const clipboardText = await navigator.clipboard.readText();
        expenseInput.value = makeJsonPretty(clipboardText);
        checkImportButtons();
    });

    addJsonBtn.addEventListener('click', async function() {
        // Спрашиваем у пользователя, действительно ли он хочет добавить данные
        const { value: jsonData } = await Swal.fire({
            title: 'Добавить данные?',
            text: 'Введенный JSON будет добавлен к текущим данным.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Добавить',
            cancelButtonText: 'Отмена'
        });

        if (jsonData) {
            // Получаем JSON из поля для ввода
            const jsonData = JSON.parse(expenseInput.value);
            // Совмещаем новые данные с сохраненными
            expenses = [...expenses,...jsonData];
            // Сохраняем изменения
            saveSettings();
            // Обновляем список
            updateExpensesList();
            // Закрываем модальное окно
            importModal.style.display = 'none';
            expenseInput.value = ''; // Очищаем поле ввода при закрытии модального окна
            checkImportButtons();
        }
    });

    loadJsonBtn.addEventListener('click', function() {
        expenseInput.value = JSON.stringify(expenses, null, 4);
        checkImportButtons();
    });

    rewriteJsonBtn.addEventListener('click', function() {
        // Получаем JSON из поля для ввода
        const jsonData = JSON.parse(expenseInput.value);
        // Совмещаем новые данные с сохраненными
        expenses = jsonData;
        // Сохраняем изменения
        saveSettings();
        // Обновляем список
        updateExpensesList();
        // Закрываем модальное окно
        importModal.style.display = 'none';
        expenseInput.value = ''; // Очищаем поле ввода при закрытии модального окна
        checkImportButtons();
    });

    // Закрытие модального окна
    cancelBtn.addEventListener('click', function() {
        importModal.style.display = 'none';
        expenseInput.value = ''; // Очищаем поле ввода при закрытии модального окна
        checkImportButtons();
    });

    expenseInput.addEventListener('input', checkImportButtons);
    expenseInput.addEventListener('blur', function() {
        this.value = makeJsonPretty(this.value);
        checkImportButtons();
    });

    updateExpensesList();
});
