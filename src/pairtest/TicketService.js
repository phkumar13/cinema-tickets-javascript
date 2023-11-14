import InvalidPurchaseException from './lib/InvalidPurchaseException';

export default class TicketService {
  #MAX_TICKETS_ALLOWED = 20;

  constructor(paymentService, seatReservationService) {
    this.ticketPaymentService = paymentService;
    this.ticketSeatReservationService = seatReservationService;
  }

  #calculateTotalAmount(ticketTypeRequests) {
    const ticketPrices = {
      ADULT: 20,
      CHILD: 10,
      INFANT: 0,
    };

    return ticketTypeRequests.reduce((totalAmount, ticketTypeRequest) => {
      const ticketType = ticketTypeRequest.getTicketType();
      const numberOfTickets = ticketTypeRequest.getNoOfTickets();
      return totalAmount + (ticketPrices[ticketType] * numberOfTickets);
    }, 0);
  }

  #validatePurchase(ticketTypeRequests) {
    // Check for invalid account id.
    if (this.accountId < 1) {
      throw new TypeError('Invalid Account Number');
    }
 
    const totalTickets = ticketTypeRequests.reduce((acc, ticketTypeRequest) => {
      return acc + ticketTypeRequest.getNoOfTickets();
    }, 0);

    // Request for over all quantity less than 1.
    if (totalTickets < 1) {
      throw new InvalidPurchaseException('Atleast one ticket should be purchased');
    }
    // Request for more than allowed over all quantity.
    else if (totalTickets > this.#MAX_TICKETS_ALLOWED) {
      throw new InvalidPurchaseException('Exceeded maximum number of tickets per purchase');
    } 
    else {
      // only progresses to this section if within allowed tickets limit
      const adultTickets = ticketTypeRequests.find((ticketTypeRequest) => ticketTypeRequest.getTicketType() === 'ADULT');
      if (!adultTickets) {
        throw new InvalidPurchaseException('At least one adult ticket is required');
      } 
      // Child and Infant tickets can be purchased if an adult is present.
    }
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // Validates and throws InvalidPurchaseException exception if validation fails.
    this.#validatePurchase(ticketTypeRequests);

    // Since we are making calls to 3rd party services, there is a possibility of errors.
    try {
      // make payment for the tickets
      this.ticketPaymentService.makePayment(accountId, this.#calculateTotalAmount(ticketTypeRequests));

      // Infants do not need a seat reservation, so no need to call reserveSeat for infants
      const seatsToReserve = ticketTypeRequests
        .filter((ticketTypeRequest) => ticketTypeRequest.getTicketType() !== 'INFANT')
        .reduce((totalSeats, ticketTypeRequest) => totalSeats + ticketTypeRequest.getNoOfTickets(), 0);

      // Reserve Seats after su
      this.ticketSeatReservationService.reserveSeat(accountId, seatsToReserve);
    }
    catch(error)
    {
      console.log('Error processing payment / reserving seats', error);
      throw error;
    }
  }
}