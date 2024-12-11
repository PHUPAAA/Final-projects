document.addEventListener("DOMContentLoaded", async () => {
    const salesTableBody = document.querySelector("#sales-report tbody");

    const loadSalesReport = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/sales");
            if (!response.ok) {
                throw new Error("Failed to fetch sales report");
            }

            const sales = await response.json();
            salesTableBody.innerHTML = ""; // ล้างข้อมูลเก่า

            sales.forEach((sale, index) => {
                const saleRow = document.createElement("tr");
                saleRow.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${sale.userId.firstName} ${sale.userId.lastName}</td>
                    <td>
                        ${sale.items
                            .map(
                                (item) => `${item.productId.name} (x${item.quantity})`
                            )
                            .join(", ")}
                    </td>
                    <td>${sale.totalAmount} ฿</td>
                    <td>${new Date(sale.purchaseDate).toLocaleDateString()}</td>
                    <td>${new Date(sale.purchaseDate).toLocaleTimeString()}</td> <!-- แสดงเวลา -->
                `;
                salesTableBody.appendChild(saleRow);
            });
        } catch (error) {
            console.error("Error loading sales report:", error);
            salesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: red;">
                        Failed to load sales report
                    </td>
                </tr>
            `;
        }
    };
    loadSalesReport();
});
