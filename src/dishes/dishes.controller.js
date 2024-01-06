const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}


function priceValidator(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price && Number.isInteger(price) && Number(price) > 0 ) {
    return next();
  }
  next({
    status: 400,
    message: `Dish must have a price that is an integer greater than 0`,
  });
}


function idValidator(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (!id || id === dishId) {
    next();
    }
    else {
      next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
    }
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res) {
  res.json({ data: dishes });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => Number(dish.id) === Number(dishId));
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish id does not exist: ${req.params.dishId}`,
  });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const foundDish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;
  res.json({ data: foundDish });
}

module.exports = {
  create: [bodyDataHas("name"), 
            bodyDataHas("description"), 
            bodyDataHas("image_url"), 
            priceValidator,
            create],
  list,
  read: [dishExists, read],
  update: [dishExists, 
            bodyDataHas("name"), 
            bodyDataHas("description"), 
            bodyDataHas("image_url"), 
            priceValidator,
            idValidator,
            update],
  dishExists,
  bodyDataHas
};
