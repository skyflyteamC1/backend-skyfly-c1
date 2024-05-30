const { PrismaClient } = require("@prisma/client");
const createHttpError = require("http-errors");

const prisma = new PrismaClient();

const getAllFlight = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, minPrice, maxPrice, hasTransit, facilities } = req.query;
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    let filters = { AND: [] };

    if (search) {
      const decodedSearch = decodeURIComponent(search);
      const searchTerms = decodedSearch.split('%20').map(term => term.toLowerCase());

      let departureFilters = [];
      let arrivalFilters = [];

      searchTerms.forEach(term => {
        const isDate = !isNaN(Date.parse(term));
        if (!isDate) {
          departureFilters.push({
            OR: [
              { departureAirport: { city: { contains: term, mode: 'insensitive' } } },
              { departureAirport: { code: { contains: term.toUpperCase(), mode: 'insensitive' } } }
            ]
          });
          arrivalFilters.push({
            OR: [
              { destinationAirport: { city: { contains: term, mode: 'insensitive' } } },
              { destinationAirport: { code: { contains: term.toUpperCase(), mode: 'insensitive' } } }
            ]
          });
        }
      });

      if (departureFilters.length > 0 || arrivalFilters.length > 0) {
        filters.AND.push({
          OR: [
            { AND: departureFilters },
            { AND: arrivalFilters }
          ]
        });
      }
    }

    if (hasTransit && hasTransit === 'true') {
      filters.AND.push({ transitAirport: { isNot: null } });
    } else if (hasTransit && hasTransit === 'false') {
      filters.AND.push({ transitAirport: null });
    }

    if (minPrice || maxPrice) {
      if (minPrice) {
        filters.AND.push({ price: { gte: parseFloat(minPrice) } });
      }
      if (maxPrice) {
        filters.AND.push({ price: { lte: parseFloat(maxPrice) } });
      }
    }

    if (facilities) {
      const facilityList = facilities.split(',');
      facilityList.forEach(facility => {
        filters.AND.push({ facilities: { contains: facility.trim() } });
      });
    }

    const flights = await prisma.flight.findMany({
      where: filters,
      skip,
      take,
      include: {
        departureAirport: true,
        transitAirport: true,
        destinationAirport: true,
      },
    });

    const total = await prisma.flight.count({ where: filters });
    const totalPages = Math.ceil(total / take);
    const currentPage = parseInt(page);

    const formattedFlights = flights.map(flight => ({
      id: flight.id,
      planeId: flight.planeId,
      departureDate: flight.departureDate,
      departureAirport: {
        id: flight.departureAirport.id,
        name: flight.departureAirport.name,
        code: flight.departureAirport.code,
        country: flight.departureAirport.country,
        city: flight.departureAirport.city,
      },
      transit: flight.transitAirport ? {
        arrivalDate: flight.transitArrivalDate,
        departureDate: flight.transitDepartureDate,
        transitAirport: {
          id: flight.transitAirport.id,
          name: flight.transitAirport.name,
          code: flight.transitAirport.code,
          country: flight.transitAirport.country,
          city: flight.transitAirport.city,
        },
      } : null,
      arrivalDate: flight.arrivalDate,
      destinationAirport: {
        id: flight.destinationAirport.id,
        name: flight.destinationAirport.name,
        code: flight.destinationAirport.code,
        country: flight.destinationAirport.country,
        city: flight.destinationAirport.city,
      },
      capacity: flight.capacity,
      price: flight.price,
      facilities: flight.facilities,
    }));

    res.status(200).json({
      status: true,
      message: "All flight data retrieved successfully",
      totalItems: total,
      pagination: {
        totalPages: totalPages,
        currentPage: currentPage,
        pageItems: flights.length,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null,
      },
      data: formattedFlights.length !== 0 ? formattedFlights : "No flight data found",
    });
  } catch (error) {
    if (error.code === 'P2025') {
      res.status(404).json({
        status: false,
        message: "No flights found with transit.",
      });
    } else {
      next(createHttpError(500, { message: error.message }));
    }
  }
};

const getFlightById = async (req, res, next) => {
  try {
    const flight = await prisma.flight.findUnique({
      where: { id: req.params.id },
      include: {
        departureAirport: true,
        transitAirport: true,
        destinationAirport: true,
      },
    });

    if (!flight) {
      return res.status(404).json({
        status: "404 Not found",
        message: "Flight not found",
      });
    }

    const formattedFlight = {
      id: flight.id,
      planeId: flight.planeId,
      departureDate: flight.departureDate,
      departureAirport: {
        id: flight.departureAirport.id,
        name: flight.departureAirport.name,
        code: flight.departureAirport.code,
        country: flight.departureAirport.country,
        city: flight.departureAirport.city,
      },
      transit: flight.transitAirport ? {
        arrivalDate: flight.transitArrivalDate,
        departureDate: flight.transitDepartureDate,
        transitAirport: {
          id: flight.transitAirport.id,
          name: flight.transitAirport.name,
          code: flight.transitAirport.code,
          country: flight.transitAirport.country,
          city: flight.transitAirport.city,
        },
      } : null,
      arrivalDate: flight.arrivalDate,
      destinationAirport: {
        id: flight.destinationAirport.id,
        name: flight.destinationAirport.name,
        code: flight.destinationAirport.code,
        country: flight.destinationAirport.country,
        city: flight.destinationAirport.city,
      },
      capacity: flight.capacity,
      price: flight.price,
      facilities: flight.facilities,
    };

    res.status(200).json({
      status: true,
      message: "Flight data retrieved successfully",
      data: formattedFlight,
    });
  } catch (error) {
    next(createHttpError(500, { message: error.message }));
  }
};

const createFlight = async (req, res, next) => {
  const {
    planeId,
    departureDate,
    departureAirportId,
    transitArrivalDate,
    transitDepartureDate,
    transitAirportId,
    arrivalDate,
    destinationAirportId,
    capacity,
    price,
    facilities
  } = req.body;

  const departureDateTime = new Date(departureDate);
  const arrivalDateTime = new Date(arrivalDate);
  const transitArrivalDateTime = new Date(transitArrivalDate)
  const transitDepartureDateTime = new Date(transitDepartureDate)

  const departureDateTimeConvert = new Date(departureDateTime.getTime() + 7 * 60 * 60 * 1000).toISOString();
  const arrivalDateTimeConvert = new Date(arrivalDateTime.getTime() + 7 * 60 * 60 * 1000).toISOString();
  const transitArrivalDateTimeConvert = new Date(transitArrivalDateTime.getTime() + 7 * 60 * 60 * 1000).toISOString();
  const transitDepartureDateTimeConvert = new Date(transitDepartureDateTime.getTime() + 7 * 60 * 60 * 1000).toISOString();

  try {
    const newFlight = await prisma.flight.create({
      data: {
        planeId,
        departureDate: departureDateTimeConvert,
        departureAirportId,
        transitArrivalDate: transitArrivalDateTimeConvert,
        transitDepartureDate: transitDepartureDateTimeConvert,
        transitAirportId,
        arrivalDate: arrivalDateTimeConvert,
        destinationAirportId,
        capacity,
        price,
        facilities
      },
      include: {
        departureAirport: true,
        transitAirport: true,
        destinationAirport: true,
      }
    });

    res.status(200).json({
      status: true,
      message: 'Flight created successfully',
      data: newFlight,
    });
  } catch (error) {
    next(createHttpError(500, { message: error.message }));
  }
};

const updateFlight = async (req, res, next) => {
  const {
    planeId,
    departureDate,
    departureAirportId,
    arrivalDate,
    destinationAirportId,
    capacity,
    price,
    facilities,
    transitArrivalDate,
    transitDepartureDate,
    transitAirportId
  } = req.body;

  const departureDateTime = new Date(departureDate);
  const arrivalDateTime = new Date(arrivalDate);
  const transitArrivalDateTime = new Date(transitArrivalDate);
  const transitDepartureDateTime = new Date(transitDepartureDate);

  const departureDateTimeConvert = new Date(departureDateTime.getTime() + 7 * 60 * 60 * 1000).toISOString();
  const arrivalDateTimeConvert = new Date(arrivalDateTime.getTime() + 7 * 60 * 60 * 1000).toISOString();
  const transitArrivalDateTimeConvert = new Date(transitArrivalDateTime.getTime() + 7 * 60 * 60 * 1000).toISOString();
  const transitDepartureDateTimeConvert = new Date(transitDepartureDateTime.getTime() + 7 * 60 * 60 * 1000).toISOString();

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
        departureDate: departureDateTimeConvert,
        departureAirportId,
        transitArrivalDate: transitArrivalDateTimeConvert,
        transitDepartureDate: transitDepartureDateTimeConvert,
        transitAirportId,
        arrivalDate: arrivalDateTimeConvert,
        destinationAirportId,
        capacity,
        price,
        facilities
      },
      include: {
        departureAirport: true,
        transitAirport: true,
        destinationAirport: true,
      }
    });

    res.status(200).json({
      status: true,
      message: 'Flight updated successfully',
      data: {
        beforeUpdate: flight,
        afterUpdate: updatedFlight,
      },
    });
  } catch (error) {
    next(createHttpError(500, { message: error.message }));
  }
};


const removeFlight = async (req, res, next) => {
  try {
    const flight = await prisma.flight.findUnique({
      where: { id: req.params.id },
      include: {
        seats: true,
        tickets: true,
      },
    });

    if (!flight) {
      return res.status(404).json({
        status: false,
        message: "Flight not found",
      });
    }

    if (flight.seats.length > 0 || flight.tickets.length > 0) {
      await prisma.ticket.deleteMany({
        where: { flightId: req.params.id },
      });

      await prisma.flightSeat.deleteMany({
        where: { flightId: req.params.id },
      });
    }

    const deletedFlight = await prisma.flight.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      status: true,
      message: "Flight deleted successfully",
      deletedData: deletedFlight,
    });
  } catch (error) {
    next(createHttpError(500, { message: error.message }));
  }
};

module.exports = {
  getAllFlight,
  getFlightById,
  createFlight,
  removeFlight,
  updateFlight,
};
