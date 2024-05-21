const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

const getAllFlight = async (req, res) => {
  try {
    const flight = await prisma.flight.findMany();
    res.status(200).json({
      status: true,
      message: "all flight data retrieved successfully",
      data: flight,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getFlightById = async (req, res) => {
  try {
    const flight = await prisma.flight.findUnique({
      where: { id: req.params.id },
    });

    if (!flight) {
      return res.status(404).json({
        status: "404 Not found",
        message: "Flight not found",
      });
    }

    const airplane = await prisma.airplane.findUnique({
      where: { id: flight.planeId },
    });

    const flightWithAirplane = { ...flight, airplane };

    res.status(200).json({
      status: true,
      message: "Flight data retrieved successfully",
      data: flightWithAirplane,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createFlight = async (req, res) => {
  const {
    planeId,
    departureDate,
    departureCity,
    departureCityCode,
    arrivalDate,
    destinationCity,
    destinationCityCode,
    price,
  } = req.body;

  const id = uuidv4();

  try {
    const planeExists = await prisma.airplane.findUnique({
      where: { id: planeId },
    });

    if (!planeExists) {
      return res.status(400).json({
        status: false,
        message: 'Invalid planeId. Plane does not exist.',
      });
    }

    const newFlight = await prisma.flight.create({
      data: {
        id,
        planeId,
        departureDate: new Date(departureDate),
        departureCity,
        departureCityCode,
        arrivalDate: new Date(arrivalDate),
        destinationCity,
        destinationCityCode,
        price,
      },
    });
    

    res.status(200).json({
      status: true,
      message: 'Flight created successfully',
      data: newFlight,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updateFlight = async (req, res) => {
  const {
    planeId,
    departureDate,
    departureCity,
    departureCityCode,
    arrivalDate,
    destinationCity,
    destinationCityCode,
    price
  } = req.body;

  try {
    const flight = await prisma.flight.findUnique({
      where: { id: req.params.id },
    });

    if (!flight) {
      return res.status(404).json({
        status: false,
        message: "Flight not found",
      });
    }

    const updatedFlight = await prisma.flight.update({
      where: { id: req.params.id },
      data: {
        planeId,
        departureDate: new Date(departureDate),
        departureCity,
        departureCityCode,
        arrivalDate: new Date(arrivalDate),
        destinationCity,
        destinationCityCode,
        price
      },
    });

    res.status(200).json({
      status: true,
      message: "Flight updated successfully",
      data: {
        beforeUpdate: flight,
        afterUpdate: updatedFlight,
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

const removeFlight = async (req, res) => {
  try {
    const flight = await prisma.flight.delete({
      where: { id: req.params.id },
    });
    if (!flight) {
      return res.status(404).json({
        status: false,
        message: "Flight not found",
      });
    }
    res.status(200).json({
      status: true,
      message: "Flight deleted successfully",
      data: flight,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getAllFlight,
  getFlightById,
  createFlight,
  removeFlight,
  updateFlight
};
