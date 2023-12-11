const Handlebars = require('handlebars');
const { format } = require('date-fns');

Handlebars.registerHelper('JSONStringify', function (object) {
  return JSON.stringify(object);
});

Handlebars.registerHelper('compareStringValue', function (value1, value2, operator, options) {
  if (operator === '==' && value1 == value2) {
    return options.fn(this);
  } else if (operator === '!=' && value1 != value2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

Handlebars.registerHelper('isSelected', function (value, expectedValue) {
  return value.toString().toLowerCase() === expectedValue.toString().toLowerCase() ? 'selected' : '';
});

Handlebars.registerHelper('formatDate', function (date) {
  if (date instanceof Date) {
    return format(date, 'dd-MM-yyyy');
  } else {
    return date;
  }
});

Handlebars.registerHelper('formatDatetime', function (date) {
  if (date instanceof Date) {
    return format(date, 'dd-MM-yyyy HH:mm:ss');
  } else {
    return date;
  }
});

Handlebars.registerHelper('compareArray', function (array, value, options) {
  return array.includes(value) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('formatCurrency', function (amount) {
  const formattedAmount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  return formattedAmount;
});

Handlebars.registerHelper('ifEqual', function (value, comparison, options) {
  if (value === comparison) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});
Handlebars.registerHelper('addOneUnit', function (number) {
  return number + 1;
});


module.exports = Handlebars;