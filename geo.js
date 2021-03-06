// SP - R$ 79
// RJ, MG, RS, PR - R$ 149
var displayPriceTimeout,
    widgetReporting = false,
    shipState = {
      'SAO PAULO': { code: 'SP', title: 'São Paulo', value: 79.00 },
      'RIO DE JANEIRO': { code: 'RJ', title: 'Rio de Janeiro', value: 149.00 },
      'MINAS GERAIS': { code: 'MG', title: 'Minas Gerais', value: 149.00 },
      'RIO GRANDE DO SUL': { code: 'RS', title: 'Rio Grande do Sul', value: 149.00 },
      'PARANA': { code: 'PR', title: 'Paraná', value: 149.00 }
    };

function displayPrice(state) {
  var cartTotal = document.getElementsByClassName('shopping-cart__total');
  if(cartTotal.length == 0) {
	  displayPriceTimeout = setTimeout(displayPrice, 100);
    return;
  } else {
  	clearTimeout(displayPriceTimeout);
  }

  var grabCartValue = cartTotal[0].innerText || '',
      grabCartValue = grabCartValue.replace('R$','').replace('$','').replace(',','.').trim(),
      cartValue = parseFloat(grabCartValue) || 0.00;

  if(widgetReporting === true)
    console.log('values: ', state, shipState[state], cartValue);

  var targetValue = parseFloat(shipState[state].value - cartValue).toFixed(2);

  if(widgetReporting === true)
    console.log('Will set price as: ', cartValue, targetValue);

  if(!document.getElementById('shippingWrapper')) {
    var infoDiv = document.createElement('div');
    infoDiv.id = 'shippingWrapper';
    window.document.body.insertBefore(infoDiv, window.document.body.firstChild);
    document.body.classList.add('hasShippingInfo');
  }

  try {
    if(widgetReporting === true)
      console.log('will set GA for FreeShipping' + shipState[state].code);

    if(typeof window.ga === 'function') {
      var gaCode = 'FreeShipping' + shipState[state].code;
      ga('send', 'event', gaCode, 'OverlayShown', { nonInteraction: true });
    }
  } catch(err) {}

  var infoWrapper = document.getElementById('shippingWrapper'),
      htmlStatusDefault = '<strong>Frete GRÁTIS para ' + shipState[state].title + '</strong> nas compras acima de R$ ' + shipState[state].value + '.',
      htmlStatusCounting = 'Com mais R$ ' + targetValue + ' você ganha o <strong>Frete Grátis para ' + shipState[state].title + '!</strong> <img src="https://cdn.shopify.com/s/files/1/1061/1924/files/Wink_Emoji_42x42.png" alt=";)">',
      htmlStatusSuccess = 'Parabéns, você Ganhou o Frete Grátis para ' + shipState[state].title + '! <img src="https://cdn.shopify.com/s/files/1/1061/1924/files/Heart_Eyes_Emoji_42x42.png" alt="<3">',
      infoHtml;

  if(widgetReporting === true)
    console.log('Info: ', htmlStatusDefault, htmlStatusCounting, htmlStatusSuccess);

  infoWrapper.classList.remove('counting', 'success');

  if(targetValue > 0 && targetValue < shipState[state].value){
    if(widgetReporting === true)
      console.log('Target value not quite state value');
    infoWrapper.classList.add('counting');
    infoHtml = htmlStatusCounting;
  }
  if(targetValue <= 0){
    if(widgetReporting === true)
      console.log('Target value more than state value');
    infoWrapper.classList.add('success');
    infoHtml = htmlStatusSuccess;
  }
  if(targetValue >= shipState[state].value){
    if(widgetReporting === true)
      console.log('Target value less than state value');
    infoHtml = htmlStatusDefault;
  }
  infoWrapper.innerHTML = '<div><p>' + infoHtml + '</p></div>';

  var shippingWrapperHeight = infoWrapper.offsetHeight;
  document.getElementsByTagName('body')[0].style.paddingTop = Math.round(shippingWrapperHeight) + 'px';
}
function processGeo() {
  if(localStorage.getItem('userGeoState')) {
    if(widgetReporting === true)
      console.log('will process, getting storage item');
    var userGeoState = JSON.parse(localStorage.getItem('userGeoState')),
        now = Date.now();

    if(userGeoState.expires && userGeoState.expires < now) {
      if(widgetReporting === true)
        console.log('expired storage item, removing');
      localStorage.removeItem('userGeoState');
      userGeoState = null;
      return requestGeo();
    }

    if(userGeoState && userGeoState.state && shipState.hasOwnProperty(userGeoState.state) === true) {
      if(widgetReporting === true)
        console.log('will display price for', userGeoState.state);
      displayPrice(userGeoState.state);

      try {
        var shopifyCartUpd = Shopify.onCartUpdate;
        Shopify.onCartUpdate = function(cart) {
          shopifyCartUpd.apply(this, arguments);
          displayPrice(userGeoState.state);
        }
      } catch(err) {}
    }
  }
}
function callback(userGeo) {
  if(widgetReporting === true)
    console.log('geoip callback');
  var userGeoExpire = Date.now() + (8*24*60*60*1000),
      userGeoState;

  if(userGeo && userGeo.state) {
    userGeoState = { state: userGeo.state.toUpperCase(), expires: userGeoExpire };
    // force STATE
    //userGeoState.state = 'Rio de Janeiro';
    if(widgetReporting === true)
      console.log('has state, setting storage', userGeoState);

    localStorage.setItem('userGeoState', JSON.stringify(userGeoState));
    processGeo();
  }
}
function requestGeo() {
  if(widgetReporting === true)
    console.log('inserting script');

  if(!document.getElementById('geoipdb')) {
    var geoScript = document.createElement('script'),
        h = document.getElementsByTagName('script')[0];

    geoScript.id = 'geoipdb';
    geoScript.type = 'text/javascript';
    geoScript.src = 'https://geoip-db.com/jsonp';
    h.parentNode.insertBefore(geoScript, h);
  }
}
if(localStorage) {
  if(localStorage.getItem('userGeoState')) {
    if(widgetReporting === true)
      console.log('has localstorage item, will process geo');
    processGeo();
  } else {
    if(widgetReporting === true)
      console.log('no localstorage item, will request geo');
    requestGeo();
  }
}
