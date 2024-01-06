const path = require("path");
// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName] && data[propertyName].length>0) {
      return next();
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` });
  };
}


function list(req, res) {
  res.json({ data: orders });
}


function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function statusValidator(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (!status || status.length===0 ||!['pending', 'preparing', 'out-for-delivery', 'delivered'].includes(status)
  ) {
    next({
    status: 400,
    message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
   });
         }
  else if (status === "delivered") {
    next({
    status: 400,
    message: `A delivered order cannot be changed`,
   });
  }
  else {next()}
}

function idValidator(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (!id || id === orderId) {
    next();
    }
    else {
      next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
    }
}

function validateDishes(req,res,next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes) {
     next({
    status: 400,
    message: `Order must include a dish`,
  });
  }
  else if(!Array.isArray(dishes) || dishes.length===0)
    {
    next({
    status: 400,
    message: `Order must include at least one dish`,
  });
    }
  else {
    for (i in dishes) {
      if(!dishes[i].hasOwnProperty('quantity') || !Number.isInteger(dishes[i].quantity)
         || Number(dishes[i].quantity) <= 0) {
       next({
        status: 400,
        message: `Dish ${dishes[i].id} must have a quantity that is an integer greater than 0`,
    });
      }
    }
    return next();
  }
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => Number(order.id) === Number(orderId));
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  else {next({
    status: 404,
    message: `Order id does not exist: ${req.params.orderId}`,
  });}
}

function read(req, res) {
  res.json({ data: res.locals.order });
}


function update(req, res) {
  const foundOrder = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;
  res.json({ data: foundOrder });
}

function validateDestroyStatus(req, res, next) {
  const foundOrder = res.locals.order;
  if (foundOrder.status != "pending") {
      next({
        status: 400,
        message: `An order cannot be deleted unless it is pending.`,
        });
    }
    else {return next()}
}

function destroy(req, res) {
  const orderId = res.locals.orderId;
  const orderIndex = orders.findIndex((order) => order.id === orderId);
  orders.splice(orderIndex, 1);
  res.sendStatus(204);
}


module.exports = {
  create: [ bodyDataHas("deliverTo"),
            bodyDataHas("mobileNumber"),
            validateDishes,
            create],
  list,
  read: [orderExists, read],
  update: [orderExists,
    idValidator,
    statusValidator,
           bodyDataHas("deliverTo"),
           bodyDataHas("mobileNumber"),
           validateDishes, 
           update],
  delete: [orderExists, validateDestroyStatus, destroy],
  orderExists
};

