document.addEventListener('DOMContentLoaded', () => {
    // Get the analysis result from localStorage
    const analysisResult = JSON.parse(localStorage.getItem('analysisResult'));
    
    if (!analysisResult) {
        alert('No analysis result found. Please scan an image first.');
        window.location.href = 'scan.html';
        return;
    }

    // Set the report date
    document.getElementById('reportDate').textContent = new Date().toLocaleDateString();

    // Create health score chart
    const ctx = document.getElementById('healthScoreChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Health Score', 'Remaining'],
            datasets: [{
                data: [analysisResult.healthScore, 100 - analysisResult.healthScore],
                backgroundColor: ['#28a745', '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Update health score display
    document.getElementById('healthScore').textContent = analysisResult.healthScore;
    document.getElementById('healthRating').textContent = analysisResult.healthRating;
    document.getElementById('riskLevel').textContent = analysisResult.riskLevel;

    // Update harmful ingredients
    const harmfulIngredientsList = document.getElementById('harmfulIngredients');
    harmfulIngredientsList.innerHTML = analysisResult.harmfulIngredients.map(ingredient => `
        <div class="ingredient-item">
            <span class="ingredient-name">${ingredient.name}</span>
            <span class="severity ${ingredient.severity.toLowerCase()}">${ingredient.severity}</span>
            <p class="ingredient-description">${ingredient.description}</p>
        </div>
    `).join('');

    // Update warnings
    const warningsList = document.getElementById('warnings');
    warningsList.innerHTML = analysisResult.warnings.map(warning => `
        <div class="risk-group">
            <h4>${warning.group}</h4>
            <p>${warning.description}</p>
        </div>
    `).join('');

    // Update long-term risks
    const longTermRisksList = document.getElementById('longTermRisks');
    longTermRisksList.innerHTML = analysisResult.longTermRisks.map(risk => `
        <div class="risk-item">
            <span class="risk-name">${risk.name}</span>
            <span class="severity ${risk.severity.toLowerCase()}">${risk.severity}</span>
            <p class="risk-description">${risk.description}</p>
        </div>
    `).join('');

    // Add button event listeners
    document.getElementById('scanAgain').addEventListener('click', () => {
        window.location.href = 'scan.html';
    });

    document.getElementById('downloadReport').addEventListener('click', () => {
        alert('Download feature coming soon!');
    });

    document.getElementById('shareReport').addEventListener('click', () => {
        alert('Share feature coming soon!');
    });
}); 