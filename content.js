(function () {
  const targetProducts = ['h2 a.a-link-normal.a-text-normal']
  const notDeliverMessages = [
    'no puede ser enviado',
    'no hay vendedores que realicen envíos a',
    'no realiza envíos a',
    'Disponible a través de',
    'no puede enviarse',
    'cannot be shipped',
    'non può essere spedito',
  ]
  const notDeliverStyle = 'color: #f56c42 !important; text-decoration: line-through !important;'

  ready(function () {
    checkProducts()
    observeNewProducts()
  })

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn()
    } else {
      document.addEventListener('DOMContentLoaded', fn)
    }
  }

  function createLoader() {
    const loader = document.createElement('span')

    loader.classList.add('shp-loader')
    loader.innerText = 'Loading...'

    return loader
  }

  function checkProducts() {
    console.log('SendHerePlz is making its magic...')

    const parser = new DOMParser()

    const promises = []
    const times = {
      'includes': { duration: [] },
      'parser': { duration: [] },
      'regex': { duration: [] },
    }

    document.querySelectorAll(targetProducts.toString()).forEach((productLink, index) => {
      const loader = createLoader()
      const removeLoader = () => loader.remove()

      productLink.parentElement.prepend(loader)

      promises.push(fetch(productLink.getAttribute('href'))
        .then(response => response.text())
        .then(data => {
          // INCLUDES
          const includesStart = performance.now()

          let isNotDeliverable = notDeliverMessages.some(message => data.includes(message))

          const includesEnd = performance.now()

          // PARSER
          const parserStart = performance.now()

          const html = parser.parseFromString(data, 'text/html')
          isNotDeliverable = !!html.querySelector('#ddmDeliveryMessage .a-color-error')

          const parserEnd = performance.now()

          // REGEX
          const regexStart = performance.now()

          isNotDeliverable = /<div id=\"ddmDeliveryMessage\" .*>[\s]*<span class="a-color-error">/g.test(data)

          const regexEnd = performance.now()

          // ---

          times.includes.duration[index] = includesEnd - includesStart
          times.parser.duration[index] = parserEnd - parserStart
          times.regex.duration[index] = regexEnd - regexStart

          if (isNotDeliverable) {
            const productTitle = productLink.querySelector('span')
            productTitle.setAttribute('style', notDeliverStyle)
          }
        })
        .finally(removeLoader)
      )
    })

    Promise.all(promises).then(() => {
      console.log('Some and includes: ', average(times.includes.duration))
      console.log('parser: ', average(times.parser.duration))
      console.log('regex: ', average(times.regex.duration))
    })
  }

  function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  function observeNewProducts() {
    const resultsLoader = document.getElementsByClassName('s-result-list-placeholder')[0]
    if (resultsLoader) {
      const observer = new MutationObserver((_) => {
        checkProducts()
      })
      observer.observe(resultsLoader, { attributes: true })
    }
  }
})()
