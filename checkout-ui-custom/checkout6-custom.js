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
        // addDiscountValue(orderForm.items)

    })

    if(window.location.hash === "#/payment") moveStepsView()

})

$(window).on('orderFormUpdated.vtex', function(e, orderForm) {
    if(!orderForm.items.length) {
        cartEmpty = true
        return cartIsEmpty()
    }

    setTotalCartItems(orderForm.items)
    adjustLayout(orderForm)
 })

window.onhashchange = hashChanged

function hashChanged() {
    const hash = window.location.hash

    if(hash === "#/payment") moveStepsView()
}

function adjustLayout(orderForm) {

    moveElement(".cart-links.cart-links-bottom", ".summary-template-holder .summary")
    moveElement("p.newsletter", ".mini-cart .payment-confirmation-wrap .payment-submit-wrap", "prepend")
    addDiscounts(orderForm.totalizers)
    addCartHeader(orderForm)
    addDeals()
    addTerms()
    setTimeout(function() {processCartItems(orderForm.items)}, 100)
    expandSummary(orderForm.items)
    adjustQuantityBadge()
    // $("#cart-note").attr("placeholder", "Order details")
    // $(".totalizers-list .srp-summary-result .info").text("Delivery")
    setTimeout(function(){
        // $(".coupon-data .link-coupon-add span:first-child").text("Have a voucher code?")
        // $("#not-corporate-client").text("Doesn't include company info")
        // $("#client-profile-data .accordion-toggle").text("Billing data")
        // $("#shipping-data .accordion-toggle").text("Delivery")
        addDiscountValue(orderForm.items)
    }, 100)
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
                        Shopping bag: <span class="cartItemsCount"></span>
                    </div>
                    <div class="cart-shipping-estimate">
                        Delivery: <span id="cartShippingEstimate"></span>
                    </div>
                </div>`
            const cartHeaderRight = ``

        $('.cart-template-holder').prepend(cartHeaderLeft)
        $('.full-cart .summary-template-holder').prepend(cartHeaderRight)
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
        if(item.slas.length) {
            const estimate = item.slas[0].shippingEstimate
            const days = parseInt(estimate.match(/\d+/))
            if(days > maxDays) maxDays = days
        }
    })

    $("#cartShippingEstimate").text(`${maxDays} zile lucratoare`)
}

function addDeals() {

    if(!$(".deals-container").length) {

        const dealsTemplate = `
            <div class="deals-container">
                <div class="deal-item">
                    <div class="deal-image-container">
                        <img src="https://timberlandbg.vtexassets.com/arquivos/truck-regular.svg" alt="truck" class="deal-image">
                    </div>
                    <div class="deal-texts">
                        <h4 class="deal-title">Free delivery</h4>
                        <p class="deal-message">For orders over 100 euros, anywhere in the country</p>
                    </div>
                </div>
                <div class="deal-item">
                    <div class="deal-image-container">
                        <img src="https://timberlandbg.vtexassets.com/arquivos/medal-regular.svg" alt="medal" class="deal-image">
                    </div>
                    <div class="deal-texts">
                        <h4 class="deal-title">Loyalty program</h4>
                        <p class="deal-message">You earn money on every order placed</p>
                    </div>
                </div>
                <div class="deal-item">
                    <div class="deal-image-container">
                        <img src="https://timberlandbg.vtexassets.com/arquivos/user-headset-regular.svg" alt="headset" class="deal-image">
                    </div>
                    <div class="deal-texts">
                        <h4 class="deal-title">Free consulting</h4>
                        <p class="deal-message">You can ask the advice of our specialists</p>
                    </div>
                </div>
            </div>
        `
        $(".full-cart").after(dealsTemplate)
    }
}

function processCartItems(products) {

    adjustImgSrc()
    addInStockMessage()
    addDiscountValue(products)
}

function adjustImgSrc() {
    $(".product-image img").attr("src", function(index, el) {
        if(el.length) {
            const newSrc = el.replace("55-55", "112-112")
            $(this).attr("src", newSrc)
        }
    })
}

function addInStockMessage() {
    const productName = $(".product-item .product-name > a:first-of-type")
    if(!productName.next().hasClass("custom-in-stock")) {
        const inStockElement = `<span class="custom-in-stock">In stock</span>`
        productName.after(inStockElement)
    }
}

function addDiscountValue(products) {

    let productsWidthDiscount = []

    products.forEach( ({listPrice, sellingPrice, quantity, id}) => {
        const discount = (listPrice - sellingPrice)/100*quantity
        if(discount) {
            productsWidthDiscount.push({id, discount})
        }
    })

    if (productsWidthDiscount.length) {
        productsWidthDiscount.forEach(({id, discount}) => {
            const existing = $(`.cart-items tr[data-sku="${id}"] td.product-name .discount-value`)

            if(existing.length) {
                existing.text(discount)
            } else {
                const discountTemplate = `<div class="discount-value-container">
                        You save $ <span class="discount-value">${discount}</span>
                    </div>`
                $(`.cart-items tr[data-sku="${id}"] td.product-name`).append(discountTemplate)
            }

        })
    }
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

// $(".payment-group-item").click(moveStepsView())
$(document).on("click", ".payment-group-item", () => moveStepsView())

function moveStepsView() {
  const moveStepsViewInterval = setInterval(function() {

    const activePaymentMethod = $(".payment-group-list-btn .payment-group-item.active")
    const paymentData = $(".steps-view")
    let fallback = 0
    if(activePaymentMethod.length && paymentData.length) {
        $(activePaymentMethod).after($(paymentData))
        clearInterval(moveStepsViewInterval)
    } else {
        if(fallback == 100) clearInterval(moveStepsView)
        fallback++
    }
  }, 200 )

}

// ============================================================= Minicart =============================================================

function addDiscounts(totalizers) {
    let discounts = 0
    const totalizersDiscounts = totalizers?.filter(el => el.id === "Discounts")[0]
    if(totalizersDiscounts) discounts = Math.abs(totalizersDiscounts.value/100).toFixed(2)

    if(!discounts) return $(".totalizers tfoot tr.custom-discounts").remove()
    if($("tfoot tr.custom-discounts").length) {
        $("tfoot tr.custom-discounts .discountsTd.monetary").text(`$${discounts}`)
    } else {

        const discountsFullCart = `<tr class="custom-discounts">
                <td class="discountsTd info" colspan="2">You save $</td>
                <td class="discountsTd monetary" colspan="2"> ${discounts}</td>
            </tr>`

        const discountsMiniCart = `<tr class="custom-discounts">
                <td class="discountsTd info" colspan="1">You save $</td>
                <td class="discountsTd monetary" colspan="2"> ${discounts}</td>
            </tr>`
        $(".full-cart .totalizers tfoot").append(discountsFullCart)
        $(".mini-cart .totalizers tfoot").append(discountsMiniCart)
    }

}

function expandSummary(items) {
    if(!items) return
    const existing = document.querySelectorAll(".summary-images-wrapper")
    Array.from(existing).forEach((el) => el.remove())

    const summaryH2 = document.querySelector(".cart-template .cart-fixed h2")

    const wrapper = createElement("div", {class: "summary-images-wrapper"})
    const header = createElement("div", {class: "summary-images-header"})
    // const headerQuantity = createElement("span", {class: "summary-images-quantity"})
    const headerToggler = createElement("span", {class: "summary-images-toggler"})
    const imagesContainer = createElement("div", {class: "summary-images-container"})

    let images = []
    // let quantity = 0

    items.forEach(item => {
      const newImgUrl = item.imageUrl ? item.imageUrl.replace("http", "https") : item.imageUrl
      images.push({image: newImgUrl, quantity: item.quantity})
    //   quantity += item.quantity
    })

    // headerQuantity.innerHTML = `${quantity} ${window.totalItems > 1 ? " produse" : " produs"}`

    headerToggler.innerText = document.querySelector(".mini-cart").classList.contains("expanded") ? "Свиване" : "Подробности"
    // header.appendChild(headerQuantity)
    header.appendChild(headerToggler)
    wrapper.appendChild(header)
    wrapper.appendChild(imagesContainer)

    images.forEach(image => {
      const imageContainer = createElement("div", {class: "summary-image-container"})

      const quantity = createElement("span", {class: "quantity badge"})
      quantity.innerHTML = image.quantity

      const imageEl = createElement("img", {src: image.image, class: "summary-image", alt: "product", title: "product image"})

      imageContainer.appendChild(imageEl)
      imageContainer.appendChild(quantity)
      imagesContainer.appendChild(imageContainer)
    })
    summaryH2.parentElement.insertBefore(wrapper, summaryH2.nextSibling)
    wrapper.addEventListener("click", function() {
      const miniCart = document.querySelector(".mini-cart")
      miniCart.classList.toggle("expanded")
      headerToggler.innerText = miniCart.classList.contains("expanded") ? "Свиване" : "Подробности"
    })
}

function adjustQuantityBadge() {
    const badges = document.querySelectorAll(".mini-cart .badge")
    badges.forEach(badge => {
      if(badge.innerText !== "1") badge.classList.add("flex")
    })
}

function addTerms() {
    var checkbox = $("#terms:checked").length;
    if (checkbox === 0) {
      $("button[class='submit btn btn-success btn-large btn-block']").addClass(
        "disabled"
      );
    }

    var checked = `<fieldset id="terms-conditions">
      <input type="checkbox" id="terms" name="terms" required="required" style="display: inline-block;vertical-align: middle;">
        <label for="terms" style="display: inline-block;vertical-align: middle;"> <a href="/pages/usloviya-za-polzvane" target="_blank">Съгласен съм с Общите Правила и Условия</a></label>
      </fieldset>`;
    if ($(".payment-submit-wrap").length == 1 && !$(".payment-submit-wrap #terms-conditions").length) {
      $(".payment-submit-wrap").prepend(checked);
    }
    $("#terms").on("click", function () {
      var checkbox = $("#terms:checked").length;
      if (checkbox === 1) {
        $(
          "button[class='submit btn btn-success btn-large btn-block disabled']"
        ).removeClass("disabled");
      } else {
        $("button[class='submit btn btn-success btn-large btn-block']").addClass(
          "disabled"
        );
      }
    });
}

// ============================================================= Helpers =============================================================

function moveElement(selector, newParent, location = "append") {
    const parent = $(newParent)
    const element = $(selector)

    if((element.length && parent.length) && !$(`${newParent} > ${selector}`).length) {
        if(location === "append") {
            $(selector).appendTo($(newParent))
        } else if (location === "prepend") {
            $(newParent).prepend($(selector))
        }

    }
}

function addElement(element, parent, position) {

}

function cartIsEmpty() {
    $(".cart-header").remove()
    $(".deals-container").remove()
}

function setTotalCartItems(items) {
    let total = 0
    items.forEach(item => total+= item.quantity)
    totalItems = total
}

function createElement(type, attributes) {
    const element =  document.createElement(type)
    for (key in attributes) {
      element.setAttribute(key, attributes[key])
    }
    return element
  }

// Translations

$(document).ready(function() {
  window.vtex.i18n["bg"].global.add = "Добави"
  window.vtex.i18n["bg"].global.goToShipping = "ПРОДЪЛЖИ КЪМ ДОСТАВКА"
  window.vtex.i18n["bg"].clientProfileData.placeholderEmail = "Въведете имейл адрес"
  window.vtex.i18n["bg"].clientProfileData.includeCo = "Добави фирмени данни"
  window.vtex.i18n["bg"].totalizers.coupon = "промо код"
  window.vtex.i18n["bg"].totalizers.couponCode = "Въведи кода"
  window.vtex.i18n["bg"].paymentData.confirm = "ПОРЪЧАЙ"
  $.extend(true, window.vtex.ko.validation.messages, { "bg-BG": { required: "Полето е задължително" }})
})
