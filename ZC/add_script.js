// Global variable to keep track of the number of rows created
let rowCount = 0;

// Track whether user has manually edited the Amount in Words field
let amountInWordsManuallyEdited = false;

// Function to generate the HTML for a new item row
function createNewRow(initialPackageStart, initialPackageEnd) {
    rowCount++;
    const rowId = `row-${rowCount}`;
    const packageStart = initialPackageStart || '';
    const packageEnd = initialPackageEnd || '';
    
    return `
        <tr id="${rowId}" class="item-row">
            <td><input type="number" class="form-control form-control-sm package-from" min="1" value="${packageStart}" onchange="updatePackageSequence(this.closest('tr'))"></td>
            <td><input type="number" class="form-control form-control-sm package-to" min="1" value="${packageEnd}" onchange="updatePackageSequence(this.closest('tr'))"></td>
            <td><input type="text" class="form-control form-control-sm description"></td>
            <td><input type="text" class="form-control form-control-sm unit"></td>
            <td><input type="number" class="form-control form-control-sm qty" min="0" step="0.01" value="0" oninput="calculateRowAmount(this.closest('tr')); updateTotals();"></td>
            <td>
                <div class="d-flex align-items-center justify-content-end">
                    <input type="number" class="form-control form-control-sm rate" min="0" step="0.01" value="0" oninput="calculateRowAmount(this.closest('tr')); updateTotals();" style="flex: 1;">
                    <span class="currency-display ms-2" style="min-width: 15px;"></span>
                </div>
            </td>
            <td>
                <div class="d-flex align-items-center justify-content-end">
                    <input type="number" class="form-control form-control-sm amount" value="0.00" readonly style="flex: 1;">
                    <span class="currency-display ms-2" style="min-width: 15px;"></span>
                </div>
            </td>
            <td><input type="number" class="form-control form-control-sm taxable-value" value="0.00" readonly></td>
            <td>
                <select class="form-select form-select-sm igst-percent" onchange="calculateRowAmount(this.closest('tr')); updateTotals();">
                    <option value="0">0%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                </select>
            </td>
            <td>
                <div class="d-flex align-items-center justify-content-end">
                    <input type="number" class="form-control form-control-sm igst-amount" value="0.00" readonly style="flex: 1;">
                    <span class="currency-display ms-2" style="min-width: 15px;"></span>
                </div>
            </td>
            <td class="text-center">
                <button type="button" class="btn btn-danger btn-sm delete-row-btn" style="background-color: #dc3545; border-color: #dc3545; color: white; font-weight: bold;">🗑️</button>
            </td>
        </tr>`;
}

/**
 * Ensures package ranges are perfectly synchronized and continuous across all rows.
 * @param {HTMLElement | null} changedRow - The row that triggered the update (or null for a mass update like delete).
 */
function updatePackageSequence(changedRow) {
    const rows = document.querySelectorAll('.item-row');
    const changedRowIndex = changedRow ? Array.from(rows).indexOf(changedRow) : -1;
    let currentStart = 1;

    rows.forEach((row, index) => {
        const fromInput = row.querySelector('.package-from');
        const toInput = row.querySelector('.package-to');
        
        let rowRangeWidth = 0;

        // 1. Set the 'From' value based on the previous row's end + 1
        fromInput.value = currentStart;

        // 2. Determine the 'To' value (end of the range)
        if (index < changedRowIndex) {
            // Rows BEFORE the changed one: Read their current 'To' and skip further modification.
            currentStart = parseInt(toInput.value, 10) + 1;
            return;
        } 
        
        if (index === changedRowIndex) {
            // For the CHANGED row: Ensure 'To' is >= 'From'.
            let currentEnd = parseInt(toInput.value, 10);
            
            // If the new 'From' (currentStart) is greater than the old 'To', bump 'To' up
            if (currentEnd < currentStart) {
                currentEnd = currentStart;
                toInput.value = currentEnd;
            }
            
            // Calculate the width of the user-defined range for this row.
            rowRangeWidth = currentEnd - currentStart + 1;

        } else {
            // For SUBSEQUENT rows (or if changedRow is null): Preserve their original width.
            
            // Calculate the row's existing width (default to 10 if invalid/new)
            // IMPORTANT: We must read the width from the existing 'From' and 'To' of *this* row,
            // NOT the 'From' value we just set (currentStart).
            rowRangeWidth = (parseInt(toInput.value, 10) - parseInt(fromInput.value, 10) + 1) || 10;
            
            // Calculate the new 'To' based on the synchronized 'From' and the preserved width
            let newEnd = currentStart + rowRangeWidth - 1;
            toInput.value = newEnd;
        }

        // 3. Prepare for the next row
        // The next row starts one unit after the current row ends
        currentStart = parseInt(toInput.value, 10) + 1;
    });
}


// Function to calculate amount for a single row
function calculateRowAmount(row) {
    const qtyInput = row.querySelector('.qty');
    const rateInput = row.querySelector('.rate');
    const amountInput = row.querySelector('.amount');
    const taxableValueInput = row.querySelector('.taxable-value');
    const igstPercentInput = row.querySelector('.igst-percent');
    const igstAmountInput = row.querySelector('.igst-amount');
    
    const qty = parseFloat(qtyInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    const igstPercent = parseFloat(igstPercentInput.value) || 0;
    
    // Calculate amount as qty * rate
    const amount = qty * rate;
    const igstAmount = amount * (igstPercent / 100);
    
    // Update the read-only fields
    amountInput.value = amount.toFixed(2);
    taxableValueInput.value = amount.toFixed(2);
    igstAmountInput.value = igstAmount.toFixed(2);
    
    // Return the calculated values in case they're needed elsewhere
    return { amount, igstAmount };
}

// Function to convert number to words (Simplified placeholder as requested)
function numberToWords(n) {
    if (isNaN(n) || n === 0) return "zero euro, zero cents";
    const [euros, cents = '00'] = String(n.toFixed(2)).split('.');
    
    // Placeholder logic for immediate update confirmation
    return `${euros} euro and ${cents} cents`;
}


// Function to recalculate all totals and update "Amount in Words"
function updateTotals() {
    let totalExportValue = 0;
    let totalGstValue = 0;
    
    // Safely get all rows and calculate totals
    const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => {
        // Safely get amount and IGST values
        const amountInput = row.querySelector('.amount');
        const igstAmountInput = row.querySelector('.igst-amount');
        
        if (amountInput) {
            totalExportValue += parseFloat(amountInput.value) || 0;
        }
        
        if (igstAmountInput) {
            totalGstValue += parseFloat(igstAmountInput.value) || 0;
        }
    });

    // Safely update total fields
    const totalExportValueEl = document.getElementById('totalExportValue');
    const totalGstValueEl = document.getElementById('totalGstValue');
    const totalInvoiceValueEl = document.getElementById('totalInvoiceValue');
    const amountInWordsEl = document.getElementById('amountInWords');
    
    if (totalExportValueEl) totalExportValueEl.value = totalExportValue.toFixed(2);
    if (totalGstValueEl) totalGstValueEl.value = totalGstValue.toFixed(2);
    
    // Calculate and update total invoice value
    const totalInvoiceValue = totalExportValue + totalGstValue;
    if (totalInvoiceValueEl) totalInvoiceValueEl.value = totalInvoiceValue.toFixed(2);

    // Update Number of Boxes from last row's "To" value
    if (rows.length > 0) {
        const lastRow = rows[rows.length - 1];
        const toInput = lastRow.querySelector('.package-to');
        const numberOfBoxesEl = document.getElementById('numberOfBoxes');
        
        if (toInput && numberOfBoxesEl) {
            const lastToValue = parseInt(toInput.value, 10) || 1;
            numberOfBoxesEl.value = lastToValue;
        }
    }

    // Update Amount in Words based on Total Invoice Value
    // Only auto-update if user hasn't manually edited it
    if (!amountInWordsManuallyEdited && amountInWordsEl) {
        amountInWordsEl.value = numberToWords(totalInvoiceValue);
    }
}

// Function to auto-expand textarea based on content
function autoExpandTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.max(textarea.scrollHeight, parseInt(getComputedStyle(textarea).minHeight)) + 'px';
}

// Function to safely set value if element exists
function setValueIfExists(id, value) {
    const element = document.getElementById(id);
    if (element) element.value = value;
}

// Main function to run when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('itemDetailsContainer');
    const addRowBtn = document.getElementById('addRowBtn');
    const removeRowBtn = document.getElementById('removeRowBtn');
    const form = document.getElementById('exportInvoiceForm');
    const amountInWordsInput = document.getElementById('amountInWords');

    // Setup event listener to detect manual edits to Amount in Words
    amountInWordsInput.addEventListener('input', () => {
        amountInWordsManuallyEdited = true;
    });

    // Initialize auto-expand textareas
    document.querySelectorAll('.auto-expand').forEach(textarea => {
        autoExpandTextarea(textarea);
        textarea.addEventListener('input', function() {
            autoExpandTextarea(this);
        });
    });

    // Currency selector mapping and updater
    const currencySelect = document.getElementById('currencySelect');
    const currencySymbolMap = { USD: '$', INR: '₹', EUR: '€' };
    function updateCurrencySymbols() {
        const sym = (currencySelect && currencySymbolMap[currencySelect.value]) || '';
        document.querySelectorAll('.currency-display').forEach(el => el.textContent = sym);
    }
    if (currencySelect) currencySelect.addEventListener('change', updateCurrencySymbols);

    // Initialize with one empty row
    if (container) {
        container.innerHTML = ''; // Clear existing rows
        container.insertAdjacentHTML('beforeend', createNewRow(1, 1));
        
        // Set sample values for the first row
        const firstRow = container.querySelector('.item-row');
        if (firstRow) {
            const fromInput = firstRow.querySelector('.package-from');
            const toInput = firstRow.querySelector('.package-to');
            const description = firstRow.querySelector('.description');
            const unit = firstRow.querySelector('.unit');
            const quantity = firstRow.querySelector('.qty');
            const rate = firstRow.querySelector('.rate');
            const igstPercent = firstRow.querySelector('.igst-percent');
            
            if (fromInput) fromInput.value = '1';
            if (toInput) toInput.value = '1';
            if (description) description.value = 'Industrial Valves - DN50, PN16, Flanged End';
            if (unit) unit.value = 'PCS';
            if (quantity) quantity.value = '10';
            if (rate) rate.value = '150.00';
            if (igstPercent) igstPercent.value = '18';
            
            // Trigger calculations
            calculateRowAmount(firstRow);
            updateTotals();
            updateCurrencySymbols();
        }
    }

    // 2. Add Row Listener: Starts the new row at the next sequential number
    addRowBtn.addEventListener('click', () => {
        const rows = document.querySelectorAll('.item-row');
        let nextStart = 1;
        
        if (rows.length > 0) {
            // Get the *persistent* 'To' value of the last row and set nextStart = To + 1
            const lastRowTo = parseInt(rows[rows.length - 1].querySelector('.package-to').value, 10) || 0;
            nextStart = lastRowTo + 1;
        }
        
        // New row defaults to a 10-unit range
        container.insertAdjacentHTML('beforeend', createNewRow(nextStart, nextStart + 9));
        
        // Update package sequence for all rows
        updatePackageSequence(null);
        updateTotals();
        updateCurrencySymbols();
    });

    // 3. Remove Last Row Listener
    removeRowBtn.addEventListener('click', () => {
        const rows = container.querySelectorAll('.item-row');
        if (rows.length > 1) { 
            container.removeChild(rows[rows.length - 1]);
            updatePackageSequence(null); // Re-sequence all remaining rows
            updateTotals();
        }
    });

    // 4. Dynamic Input Listener for all item rows
    container.addEventListener('input', (event) => {
        const target = event.target;
        const row = target.closest('.item-row');

        if (!row) return; // Exit if the input isn't inside a row

        // Listener for Unit/Quantity/Rate changes (updates amounts/totals immediately)
        if (target.classList.contains('unit') || target.classList.contains('qty') || target.classList.contains('rate')) {
            calculateRowAmount(row);
            updateTotals();
        }

        // Listener for Taxable Value and IGST % changes
        if (target.classList.contains('taxable-value') || target.classList.contains('igst-percent')) {
            calculateRowAmount(row);
            updateTotals();
        }

        // Listener for From/To changes (updates sequencing)
        if (target.classList.contains('package-from') || target.classList.contains('package-to')) {
            let val = parseInt(target.value, 10);
            if (isNaN(val) || val < 1) val = 1;
            target.value = val;

            const fromInput = row.querySelector('.package-from');
            const toInput = row.querySelector('.package-to');
            const changedField = target.classList.contains('package-from') ? 'from' : 'to';

            // Enforce From <= To (Immediate validation)
            if (parseInt(fromInput.value, 10) > parseInt(toInput.value, 10)) {
                // If the 'From' or 'To' value causes an overlap, fix the other one.
                if (changedField === 'from') {
                    toInput.value = fromInput.value;
                } else {
                    fromInput.value = toInput.value;
                }
            }

            // Re-sequence all rows starting from the one that was edited
            updatePackageSequence(row);
        }

        // Always ensure totals are recalculated after any relevant change
        if (target.classList.contains('unit') || target.classList.contains('qty') || target.classList.contains('rate') || target.classList.contains('package-from') || target.classList.contains('package-to')) {
             updateTotals();
        }
    });

    // 5. Delete Specific Row Listener
    container.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-row-btn')) {
            const rowToDelete = event.target.closest('.item-row');
            const rows = container.querySelectorAll('.item-row');
            if (rows.length > 1) { 
                container.removeChild(rowToDelete);
                updatePackageSequence(null); // Re-sequence all
                updateTotals();
            } else {
                alert("Cannot delete the last remaining row.");
            }
        }
    });

    // 6. Form Submission (Send to Backend)
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Collect all form data
        const items = [];
        container.querySelectorAll('.item-row').forEach(row => {
            items.push({
                from: row.querySelector('.package-from').value,
                to: row.querySelector('.package-to').value,
                description: row.querySelector('.description').value,
                unit: row.querySelector('.unit').value,
                quantity: row.querySelector('.qty').value,
                rate: row.querySelector('.rate').value,
                amount: row.querySelector('.amount').value,
                taxableValue: row.querySelector('.taxable-value').value,
                igstPercent: row.querySelector('.igst-percent').value,
                igstAmount: row.querySelector('.igst-amount').value
            });
        });
        
        const data = {
            invoiceNumber: document.getElementById('invoiceNumber').value,
            invoiceDate: document.getElementById('invoiceDate').value,
            buyerOrderNumber: document.getElementById('buyerOrderNumber').value,
            buyerOrderDate: document.getElementById('buyerOrderDate').value,
            exporterReference: document.getElementById('exporterReference').value,
            iecNumber: document.getElementById('iecNumber').value,
            taxRegistrationNumber: document.getElementById('taxRegistrationNumber').value,
            lutArnNumber: document.getElementById('lutArnNumber').value,
            deliveryPaymentTerms: document.getElementById('deliveryPaymentTerms').value,
            portOfLoading: document.getElementById('portOfLoading').value,
            portOfDischarge: document.getElementById('portOfDischarge').value,
            preCarriageBy: document.getElementById('preCarriageBy').value,
            placeOfReceipt: document.getElementById('placeOfReceipt').value,
            portOfDestination: document.getElementById('portOfDestination').value,
            destination: document.getElementById('destination').value,
            currency: document.getElementById('currencySelect') ? document.getElementById('currencySelect').value : '',
            vesselFlight: document.getElementById('vesselFlight').value,
            countryOfOrigin: document.getElementById('countryOfOrigin').value,
            adCode: document.getElementById('adCode').value,
            otherReference: document.getElementById('otherReference').value,
            hsCode: document.getElementById('hsCode').value,
            finalDestination: document.getElementById('finalDestination').value,
            contactPersonName: document.getElementById('contactPersonName').value,
            contactEmail: document.getElementById('contactEmail').value,
            consigneeAddress: document.getElementById('consigneeAddress').value,
            deliveryAddress: document.getElementById('deliveryAddress').value,
            amountInWords: document.getElementById('amountInWords').value,
            totalExportValue: document.getElementById('totalExportValue').value,
            totalGstValue: document.getElementById('totalGstValue').value,
            totalInvoiceValue: document.getElementById('totalInvoiceValue').value,
            numberOfBoxes: document.getElementById('numberOfBoxes').value,
            items: items
        };

        console.log('Submitting form data:', data);
        
        // Try to save the invoice
        fetch('/api/zc-exporter/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Server response not OK:', text);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${text}`);
                });
            }
            return response.json();
        })
        .then(result => {
            console.log('Success response:', result);
            alert('Invoice submitted successfully!');
            window.location.href = '/zc_exporter/view';
        })
        .catch(error => {
            console.error('Error details:', error);
            alert('Failed to submit invoice. Please check the console for details.');
            console.error('Full error object:', JSON.stringify(error, null, 2));
        });
    });
});
