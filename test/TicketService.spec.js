import { jest } from "@jest/globals";
import TicketService from '../src/pairtest/TicketService.js';
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService.js';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest.js';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException.js';

jest.mock("../src/thirdparty/paymentgateway/TicketPaymentService");
jest.mock("../src/thirdparty/seatbooking/SeatReservationService");

describe('TicketService', () => {
  let ticketService;
  let paymentService;
  let reservationService;

  beforeEach(() => {
    paymentService = new TicketPaymentService();
    reservationService = new SeatReservationService();
    ticketService = new TicketService(paymentService, reservationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Successfully purchase valid ticket request', () => {
    const accountId = 100;
    const ticketTypes = [
      new TicketTypeRequest('ADULT', 2),
      new TicketTypeRequest('CHILD', 1),
      new TicketTypeRequest('INFANT', 1),
    ];
    // Using spyOn technique
    const paymentSpy = jest.spyOn(paymentService, 'makePayment');
    const reservationSpy = jest.spyOn(reservationService, 'reserveSeat');

    ticketService.purchaseTickets(accountId, ...ticketTypes);
    expect(paymentSpy).toHaveBeenCalledTimes(1);
    expect(reservationSpy).toHaveBeenCalledTimes(1);
  });

  it("Successfully purchase max allowed tickets", () => {
    const accountId = 101;
    const ticketTypeRequests = [
        new TicketTypeRequest('ADULT', 12),
        new TicketTypeRequest('CHILD', 5),
        new TicketTypeRequest('INFANT', 3),
    ];

    // Using mock technique
    ticketService.purchaseTickets(accountId, ...ticketTypeRequests);
    expect(paymentService.makePayment).toHaveBeenCalledTimes(1);
    expect(reservationService.reserveSeat).toHaveBeenCalledTimes(1);
  });

  it('Should throw InvalidPurchaseException for exceeding maximum allowed tickets for all types', () => {
    const accountId = 200;
    const ticketTypes = [
        new TicketTypeRequest('ADULT', 10),
        new TicketTypeRequest('CHILD', 10),
        new TicketTypeRequest('INFANT', 10),
      ];

    expect(() => {
        ticketService.purchaseTickets(accountId, ...ticketTypes);
    }).toThrow(InvalidPurchaseException);
  });

  it('Should throw InvalidPurchaseException for exceeding maximum allowed tickets for adults', () => {
    const accountId = 300;
    const ticketTypes = [new TicketTypeRequest('ADULT', 25)];

    expect(() => {
        ticketService.purchaseTickets(accountId, ...ticketTypes);
    }).toThrow(InvalidPurchaseException);
  });

  it('Should throw InvalidPurchaseException for purchasing only Infant tickets without an Adult ticket', () => {
    const accountId = 400;
    const ticketTypes = [
      new TicketTypeRequest('INFANT', 2)
    ];

    expect(() => {
        ticketService.purchaseTickets(accountId, ...ticketTypes);
    }).toThrow(InvalidPurchaseException);
  });

  test('Should throw InvalidPurchaseException for purchasing only Children tickets without an Adult ticket', () => {
    const accountId = 500;
    const ticketTypes = [
      new TicketTypeRequest('CHILD', 2)
    ];

    expect(() => {
        ticketService.purchaseTickets(accountId, ...ticketTypes);
    }).toThrow(InvalidPurchaseException);
  });

  it('Should throw InvalidPurchaseException for purchasing only Child and Infant tickets without an Adult ticket', () => {
    const accountId = 600;
    const ticketTypes = [
      new TicketTypeRequest('CHILD', 2),
      new TicketTypeRequest('INFANT', 1)
    ];

    expect(() => {
        ticketService.purchaseTickets(accountId, ...ticketTypes);
    }).toThrow(InvalidPurchaseException);
  });
  
  it('Should throw InvalidPurchaseException for invalid ticket purchase with zero tickets', () => {
    const accountId = 700;
    const ticketTypes = [new TicketTypeRequest('ADULT', 0)];

    expect(() => {
        ticketService.purchaseTickets(accountId, ...ticketTypes);
    }).toThrow(InvalidPurchaseException);
  });
  
  it("Should throw TypeError when invalid ticket type is provided", function () {
    expect(() => {
      new TicketTypeRequest("OAP", 18);
    }).toThrow(TypeError);
  });

  it("Should throw TypeError when invalid number of tickets provided", function () {
    expect(() => {
      new TicketTypeRequest("CHILD", 0.5);
    }).toThrow(TypeError);
  });

  it("throws TypeError when AccountIdValidation fails", () => {
    const accountId = -1;
    const ticketTypeRequests = [
      { type: "ADULT", noOfTickets: 2 },
      { type: "CHILD", noOfTickets: 1 },
      { type: "INFANT", noOfTickets: 1 },
    ];

    expect(() => {
      ticketService.purchaseTickets(accountId, ...ticketTypeRequests);
    }).toThrow(TypeError);

    expect(paymentService.makePayment).toHaveBeenCalledTimes(0);
    expect(reservationService.reserveSeat).toHaveBeenCalledTimes(0);
  });
});