moment.locale('id');

const currentMonthName = moment().format('MMMM');
const currentMonthNumber = moment().format('MM');
const currentYear = moment().format('YYYY');

const selectedMonth = $('#selectedMonth');
$(selectedMonth).text(currentMonthName + " " + currentYear);