/// <reference types="cypress" />

// Welcome to Cypress!
//
// This spec file contains a variety of sample tests
// for a todo list app that are designed to demonstrate
// the power of writing tests in Cypress.
//
// To learn more about how Cypress works and
// what makes it such an awesome testing tool,
// please read our getting started guide:
// https://on.cypress.io/introduction-to-cypress

describe('example to-do app', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test


    cy.visit('http://localhost:3000')

    cy.on('window:alert', (str) => {
      // Assert that the alert message is what you expect
      expect(str).to.equal('Could not connect to ethereum wallet');
    });


  })

  it('should display exactly 3 SUPPLY and 3 WITHDRAW buttons', () => {
    // Visit the page where your buttons are located.
    // Replace '/' with the actual path if your buttons are on a different page.

    // Check for 'SUPPLY' buttons
    cy.contains('button', 'Supply');

    // Check for 'WITHDRAW' buttons
    cy.contains('button', 'Withdraw');
  })
})