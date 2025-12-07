let rowCount = 0;

// Function to generate a new table row HTML
function createNewRow(initialPackageStart) {
    rowCount++;
    const startNum = initialPackageStart || 1;
    const endNum = startNum + 6; // Example logic: each row covers 7 packages (1-7, 8-14, etc.)
    
    return `
        <div class="row border-bottom py-3 item-row" data-row-id="${rowCount}">
            <div class="col-12 mb-2 d-flex justify-content-between">
                <strong>Package Range:</strong> ${startNum} - ${endNum}
            </div>
            
            <div class="col-md-1 mb-2">
                <label class="form-label small">From</label>
                <input type="number" class="form-control form-control-sm package-from" value="${startNum}" disabled>
            </div>
            <div class="col-md-1 mb-2">
                <label class="form-label small">To</label>
                <input type="number" class="form-control form-control-sm package-to" value="${endNum}" disabled>
            </div>
            <div class="col-md-3 mb-2">
                <label class="form-label small">Descrip</label>
                <input type="text" class="form-control form-control-sm description" placeholder="Description of Goods">
            </div>
            <div class="col-md-1 mb-2">
                <label class="form-label small">Unit</label>
                <input type="text" class="form-control form-control-sm unit" placeholder="Unit">
            </div>
            <div class="col-md-2 mb-2">
                <label class="form-label small">Quantity</label>
                <input type="number" class="form-control form-control-sm quantity" value="0" min="0">
            </div>
            <div class="col-md-2 mb-2">
                <label class="form-label small">Rate</label>
                <input type="number" class="form-control form-control-sm rate" value="0.00" min="0">
            </div>
            <div class="col-md-1 mb-2 d-flex align-items-end">
                <div class="w-100">
                    <label class="form-label small">Amount</label>
                    <input type="text" class="form-control form-control-sm amount" value="0.00" disabled>
                </div>
            </div>
            <div class="col-md-1 mb-2 d-flex align-items-end">
                <button type="button" class="btn btn-danger btn-sm delete-row-btn w-100">DELETE</button>
            </div>
        </div>
    `;
}

// Function to get the package number where the next row should start
function getNextPackageStart() {
    const rows = document.querySelectorAll('.item-row');
    if (rows.length === 0) {
        return 1;
    }
    // Get the 'To' value of the last row and add 1
    const lastRowToInput = rows[rows.length - 1].querySelector('.package-to');
    return parseInt(lastRowToInput.value, 10) + 1;
}

// Function to calculate amount for a row
function calculateRowAmount(row) {
    const quantity = parseFloat(row.querySelector('.quantity').value) || 0;
    const rate = parseFloat(row.querySelector('.rate').value) || 0;
    const amount = (quantity * rate).toFixed(2);
    row.querySelector('.amount').value = amount;
    return parseFloat(amount);
}

// Function to recalculate all totals
function updateTotals() {
    let totalExportValue = 0;
    document.querySelectorAll('.item-row').forEach(row => {
        totalExportValue += calculateRowAmount(row);
    });

    // Update the disabled total fields
    document.getElementById('totalExportValue').value = totalExportValue.toFixed(2);
    // Assuming GST is 0 for export or calculated later, keeping it 0.00 as per screenshot
    document.getElementById('totalGstValue').value = (0.00).toFixed(2); 
    
    // Total Invoice Value = Total Export Value + Total GST Value
    const totalInvoiceValue = totalExportValue + parseFloat(document.getElementById('totalGstValue').value);
    document.getElementById('totalInvoiceValue').value = totalInvoiceValue.toFixed(2);

    // TODO: Implement number to words conversion for 'amountInWords'
}

// Add event listeners once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('itemDetailsContainer');
    const addRowBtn = document.getElementById('addRowBtn');
    const removeRowBtn = document.getElementById('removeRowBtn');
    const form = document.getElementById('exportInvoiceForm');

    // 1. Initial Row
    container.innerHTML += createNewRow(1);
    updateTotals();

    // 2. Add Row Listener
    addRowBtn.addEventListener('click', () => {
        const nextStart = getNextPackageStart();
        container.innerHTML += createNewRow(nextStart);
    });

    // 3. Remove Last Row Listener
    removeRowBtn.addEventListener('click', () => {
        const rows = container.querySelectorAll('.item-row');
        if (rows.length > 1) { // Ensure at least one row remains
            container.removeChild(rows[rows.length - 1]);
            updateTotals();
        }
    });

    // 4. Dynamic Input Listeners (for quantity/rate changes)
    container.addEventListener('input', (event) => {
        if (event.target.classList.contains('quantity') || event.target.classList.contains('rate')) {
            updateTotals();
        }
    });

    // 5. Delete Specific Row Listener
    container.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-row-btn')) {
            const rowToDelete = event.target.closest('.item-row');
            if (container.querySelectorAll('.item-row').length > 1) { // Ensure at least one row remains
                container.removeChild(rowToDelete);
                // Re-sequence 'From' and 'To' fields after deletion
                let currentPackageStart = 1;
                container.querySelectorAll('.item-row').forEach(row => {
                    const packageToInput = row.querySelector('.package-to');
                    const packageFromInput = row.querySelector('.package-from');
                    
                    packageFromInput.value = currentPackageStart;
                    currentPackageStart = currentPackageStart + 7;
                    packageToInput.value = currentPackageStart - 1;
                    
                    row.querySelector('strong').textContent = `Package Range: ${packageFromInput.value} - ${packageToInput.value}`;
                });
                updateTotals();
            } else {
                alert("Cannot delete the last remaining row.");
            }
        }
    });

    // 6. Form Submission (Simulated)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Invoice Form Submitted! Check console for data structure.');
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const items = [];
        container.querySelectorAll('.item-row').forEach(row => {
            items.push({
                from: row.querySelector('.package-from').value,
                to: row.querySelector('.package-to').value,
                description: row.querySelector('.description').value,
                unit: row.querySelector('.unit').value,
                quantity: row.querySelector('.quantity').value,
                rate: row.querySelector('.rate').value,
                amount: row.querySelector('.amount').value
            });
        });
        
        data.items = items;
        data.totalExportValue = document.getElementById('totalExportValue').value;
        data.totalInvoiceValue = document.getElementById('totalInvoiceValue').value;

        console.log("Invoice Data:", data);
        
        // You would typically send this 'data' object to a backend server here.
        
        // Hide modal after successful submission
        const modal = bootstrap.Modal.getInstance(document.getElementById('invoiceModal'));
        modal.hide();
    });
});