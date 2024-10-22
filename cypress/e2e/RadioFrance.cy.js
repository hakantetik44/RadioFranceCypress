/// <reference types="cypress" />

describe('Fonctionnalités de base de France Culture', () => {
  beforeEach(() => {
    cy.visit('https://www.franceculture.fr/');
    cy.task('log', 'Page France Culture chargée');
    
    // Daha güvenilir çerez yönetimi
    cy.get('body').then(($body) => {
      // Didomi popup'ı kontrol et ve gerekirse kapat
      if ($body.find('#didomi-popup').length > 0) {
        cy.get('#didomi-notice-agree-button').click();
        cy.log('Cookies acceptés via Didomi');
        cy.task('log', 'Cookies acceptés via Didomi');
        
        // Popup'ın kaybolmasını bekle
        cy.get('#didomi-popup').should('not.be.visible');
      } else {
        cy.log('Pas de bannière Didomi détectée');
        cy.task('log', 'Pas de bannière Didomi détectée');
      }
      
      // Diğer olası çerez banner'larını kontrol et
      if ($body.find('span:contains("Tout accepter")').length > 0) {
        cy.contains('span', 'Tout accepter').click();
        cy.log('Cookies additionnels acceptés');
        cy.task('log', 'Cookies additionnels acceptés');
      }
    });
  });

  it('charge la page d\'accueil et vérifie le titre', () => {
    cy.title().should('include', 'France Culture')
      .then((title) => {
        cy.log(`Titre de la page: ${title}`);
        cy.task('log', `Titre de la page: ${title}`);
      });
  });

  it('vérifie le menu principal', () => {
    // Menu elementini kontrol et
    cy.get('nav#menu')
      .should('exist')
      .then(($nav) => {
        // Menü gizliyse, açmak için butona tıkla
        if (!$nav.is(':visible')) {
          cy.get('button[aria-label="ouvrir le menu"]').click();
        }
        cy.task('log', 'Menu principal trouvé');
      });

    // Menü öğelerini kontrol et
    cy.get('nav#menu li')
      .should('have.length.at.least', 5)
      .then((items) => {
        cy.log(`Nombre d'éléments dans le menu principal: ${items.length}`);
        cy.task('log', `Nombre d'éléments dans le menu principal: ${items.length}`);
      });
  });

  it('vérifie le lien de recherche', () => {
    // Çerez popup'ının kaybolmasını bekle
    cy.get('#didomi-popup').should('not.exist').then(() => {
      // Arama linkini farklı selektörlerle dene
      cy.get('a[href="/recherche"], .Button.light.tertiary.large, a[aria-label*="recherche"]')
        .should('be.visible')
        .then(() => {
          cy.log('Lien de recherche trouvé');
          cy.task('log', 'Lien de recherche trouvé');
        });
    });
  });
});