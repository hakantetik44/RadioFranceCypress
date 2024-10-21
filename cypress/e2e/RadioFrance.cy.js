/// <reference types="cypress" />

describe('Fonctionnalités de base de France Culture', () => {
  beforeEach(() => {
    cy.visit('https://www.franceculture.fr/');
    cy.task('log', 'Page France Culture chargée');

    // Gestion des cookies
    cy.get('body').then(($body) => {
      if ($body.find('span:contains("Tout accepter")').length > 0) {
        cy.contains('span', 'Tout accepter').click();
        cy.task('log', 'Cookies acceptés');
      } else {
        cy.task('log', 'Pas de bannière de cookies détectée');
      }
    });
  })

  it('charge la page d\'accueil et vérifie le titre', () => {
    cy.title().should('include', 'France Culture')
      .then((title) => {
        cy.task('log', `Titre de la page: ${title}`);
      });
  })

  it('vérifie le menu principal', () => {
    cy.get('nav[role="navigation"][aria-label="menu principal"]').should('be.visible')
      .then(() => {
        cy.task('log', 'Menu principal trouvé');
      });
    cy.get('nav[role="navigation"][aria-label="menu principal"] ul li').should('have.length.at.least', 5)
      .then((items) => {
        cy.task('log', `Nombre d'éléments dans le menu principal: ${items.length}`);
      });
  })


  it('vérifie le lien de recherche', () => {
    cy.get('a[href="/recherche"]').should('be.visible')
      .then(() => {
        cy.task('log', 'Lien de recherche trouvé');
      });
  })
})