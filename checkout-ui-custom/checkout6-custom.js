// WARNING: THE USAGE OF CUSTOM SCRIPTS IS NOT SUPPORTED. VTEX IS NOT LIABLE FOR ANY DAMAGES THIS MAY CAUSE. THIS MAY BREAK YOUR STORE AND STOP SALES. IN CASE OF ERRORS, PLEASE DELETE THE CONTENT OF THIS SCRIPT.

// ============================================================= Global =============================================================

cartEmpty = false
totalItems = 0
freeShippingValue = 149

$(document).ready(function() {

    
    $('body').on('click', '.link-coupon-add', function () {
        $(".totalizers .summary-coupon-wrap").toggleClass("expanded")
    });

    vtexjs.checkout.getOrderForm().then(function (orderForm) { 

        if(!orderForm.items.length) {
            cartEmpty = true
            return cartIsEmpty()
        }

        setTotalCartItems(orderForm.items)
        adjustLayout(orderForm)

        if(orderForm.shippingData && orderForm.shippingData.address === null) {
            return vtexjs.checkout.calculateShipping({country: "ROU", postalCode: "030119"})
        }
    })
})

$(window).on('orderFormUpdated.vtex', function(e, orderForm) { 
    
    if(!orderForm.items.length) {
        cartEmpty = true
        return cartIsEmpty()
    }

    setTotalCartItems(orderForm.items)
    adjustLayout(orderForm)
 })

function adjustLayout(orderForm) {

    moveElement(".cart-links.cart-links-bottom", ".summary-template-holder .summary")
    // moveElement(".summary-coupon-wrap:not(.span7)", ".summary-template-holder")
    addCartHeader(orderForm)
    addDeals()
    processCartItems()
    
    $(".totalizers .summary-coupon-wrap").removeClass("expanded")
    setTimeout(function() {
        if($(".full-cart .summary-template-holder .totalizers .coupon-fields span.info > span").text() !== "") $(".totalizers .summary-coupon-wrap").addClass("has-code")
    }, 100)
}

// ============================================================= Cart page =============================================================

function addCartHeader(orderForm) {

    if(!$(".cart-header").length) {
        const cartHeaderLeft = `
                <div class="cart-header cart-header-left">
                    <div class="cart-items-count"> 
                        Cosul tau de cumparaturi: <span class="cartItemsCount"></span>
                    </div>
                    <div class="cart-shipping-estimate">
                        Timp de livrare: <span id="cartShippingEstimate"></span>
                    </div>
                </div>`
            const cartHeaderRight = `
                <div class="cart-header cart-header-right free-shipping-bar">
                    <div class="free-shipping-image-container">
                        <img src="https://pentruanimale.vtexassets.com/arquivos/free-shipping.png" alt="delivery truck" class="free-shipping-image">
                    </div>
                    <div class="free-shipping-message"></div>
                </div>`
        
        $('.cart-template-holder').prepend(cartHeaderLeft)
        $('.summary-template-holder').prepend(cartHeaderRight)
    }

    updateCartItems()
    updateFreeShippingBar(orderForm)
    updateShippingEstimate(orderForm.shippingData.logisticsInfo)
}

function updateCartItems() {

    const container = $(".cart-items-count")
    const spanValue = `${totalItems} ${totalItems > 1 ? "produse" : "produs"}`

    if(container.length) {
        $(".cart-items-count .cartItemsCount").text(spanValue)
    }
}

function updateFreeShippingBar(orderForm) {

    const container = $(".free-shipping-bar")
    const totalValue = orderForm.totalizers.filter(value => value.id === "Items")[0]?.value/100
    const message = totalValue > freeShippingValue  ?
         `Felicitari! Beneficiezi de <span class="free-shipping-text">Transport gratuit</span>` :
         `Adauga produse in valoare de <span class="free-shipping-value">${(freeShippingValue - totalValue).toFixed(2)} Lei</span> si primesti <span class="free-shipping-text">Transport gratuit</span>`

    if(container.length) {
        $(".free-shipping-bar .free-shipping-message").html(message)
    }
}

function updateShippingEstimate(logisticsInfo) {
    if(!logisticsInfo.length || !logisticsInfo[0].addressId) return null
    let maxDays = 0

    logisticsInfo.forEach(item => {
        const estimate = item.slas[0].shippingEstimate
        const days = parseInt(estimate.match(/\d+/))
        if(days > maxDays) maxDays = days
    })

    $("#cartShippingEstimate").text(`${maxDays} zile lucratoare`)
}

function addDeals() {

    if(!$(".deals-container").length) {

        const dealsTemplate = `
            <div class="deals-container">
                <div class="deal-item">
                    <div class="deal-image-container">
                        <img src="https://pentruanimale.vtexassets.com/arquivos/truck-regular.svg" alt="truck" class="deal-image">
                    </div>
                    <div class="deal-texts">
                        <h4 class="deal-title">Livrare Gratuita</h4>
                        <p class="deal-message">Pentru comenzi peste 149 lei, oriunde in tara</p>
                    </div>
                </div>
                <div class="deal-item">
                    <div class="deal-image-container">
                        <img src="https://pentruanimale.vtexassets.com/arquivos/medal-regular.svg" alt="medal" class="deal-image">
                    </div>
                    <div class="deal-texts">
                        <h4 class="deal-title">Program de fidelizare</h4>
                        <p class="deal-message">Castigi bani la fiecare comanda facuta</p>
                    </div>
                </div>
                <div class="deal-item">
                    <div class="deal-image-container">
                        <img src="https://pentruanimale.vtexassets.com/arquivos/user-headset-regular.svg" alt="headset" class="deal-image">
                    </div>
                    <div class="deal-texts">
                        <h4 class="deal-title">Consultanta Gratuita</h4>
                        <p class="deal-message">Poti cere sfatul specialistilor nostri</p>
                    </div>
                </div>
            </div>
        `
        $(".cart-template").after(dealsTemplate)
    }
}

function processCartItems() {

    $(".product-image img").attr("src", function(index, el) {
        if(el.length) {
            const newSrc = el.replace("55-55", "112-112")
            $(this).attr("src", newSrc)
        }
    })
}

$(document).on("click", "#cart-coupon-add", function(e) {
    let intervalTimes = 0
    const couponInterval = setInterval(function() {
      const couponVal = $(".full-cart .summary-template-holder .totalizers .coupon-fields span.info > span")
      if(couponVal.text() === "" && intervalTimes < 50) return intervalTimes++
      checkCoupon()
      clearInterval(couponInterval)
    }, 200)
})
  
function checkCoupon() {
    const couponSpan = $(".full-cart .summary-template-holder .totalizers .coupon-fields span.info > span")
    const hasValue = couponSpan.text() !== ""
    if(hasValue) {
      if(!couponSpan.next().hasClass("coupon-message")) {
        const couponMessage = `<span class="coupon-message"> a fost aplicat cu succes</span>`
        couponSpan.after(couponMessage)
        $(".totalizers .summary-coupon-wrap").addClass("has-code")
      }
    }
}
  
$(document).on("click", "#cart-coupon-remove", function(e) {
    $(".totalizers .summary-coupon-wrap").removeClass("has-code")
})

// ============================================================= Email page =============================================================

// ============================================================= Profile step =============================================================

// ============================================================= Shipping step =============================================================

// ============================================================= Payment step =============================================================

// ============================================================= Minicart =============================================================

// ============================================================= Helpers =============================================================

function moveElement(selector, newParent) {
    const element = $(selector)
    const parent = $(newParent)
    
    if((element.length && parent.length) && !$(`${newParent} > ${selector}`).length) {
        $(selector).appendTo($(newParent))
    }
}

function addElement(element, parent, position) {

}

function cartIsEmpty() {

}

function setTotalCartItems(items) {
    let total = 0
    items.forEach(item => total+= item.quantity)
    totalItems = total
}