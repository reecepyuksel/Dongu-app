describe('Item Lifecycle E2E Test', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123'
  };

  const itemData = {
    title: 'Cypress Test Item ' + Date.now(),
    description: 'This is a test item created by Cypress E2E test.',
    city: 'İstanbul',
    district: 'Beşiktaş'
  };

  it('should login, create an item, verify it on home page, and delete it', () => {
    // 1. Login
    cy.visit('/login');
    cy.get('input[type="email"]').type(testUser.email);
    cy.get('input[type="password"]').type(testUser.password);
    cy.get('button[type="submit"]').click();

    // Verify login redirected to dashboard
    cy.url().should('include', '/dashboard');

    // 2. Create a new item
    cy.contains('button', 'Döngüye Kat').click();
    
    // Step 1: Selection
    cy.get('input[type="radio"][value="donation"]').check({ force: true });
    cy.contains('button', 'İleri').click();

    // Step 2: Details
    cy.get('input[name="title"]').type(itemData.title);
    cy.get('textarea[name="description"]').type(itemData.description);
    
    // Custom SearchableSelect interaction for City
    cy.contains('label', 'Şehir').parent().find('button').click();
    cy.get('input[placeholder="Ara..."]').type(itemData.city);
    cy.contains('button', itemData.city).click();

    // Custom SearchableSelect interaction for District
    cy.contains('label', 'İlçe').parent().find('button').click();
    cy.get('input[placeholder="Ara..."]').type(itemData.district);
    cy.contains('button', itemData.district).click();
    
    cy.contains('button', 'İleri').click();

    // Step 3: Type & Delivery
    cy.get('input[type="radio"][value="lottery"]').check({ force: true });
    // Select first delivery method (pickup)
    cy.get('input[type="checkbox"]').first().check({ force: true });
    
    // Submit
    cy.contains('button', 'Döngüyü Başlat').click();

    // Success notification and modal close
    cy.contains('Döngün başarıyla başlatıldı').should('be.visible');
    
    // 3. Verify on Home Page
    cy.visit('/');
    cy.get('button').contains('Döngüde').should('have.class', 'bg-emerald-600'); // Selection color
    
    // Check for dynamic title
    cy.contains('Döngüdeki Eşyalar').should('be.visible');
    
    cy.contains(itemData.title).should('be.visible');
    // Verify badge
    cy.contains(itemData.title).parents('.group').find('.badge').contains('Döngüde');

    // 4. Delete Item
    cy.contains(itemData.title).click(); // Navigate to detail
    cy.url().should('include', '/items/');
    
    cy.get('button[title="Paylaşımı Döngüden Çıkar"]').click();
    cy.contains('Evet, Döngüden Çıkar').click();

    // Should redirect to home and item should be gone
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains(itemData.title).should('not.exist');
  });
});
