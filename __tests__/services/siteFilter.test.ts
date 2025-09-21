import { SiteFilter } from '~src/services/siteFilter'

describe('SiteFilter', () => {
  it('blocks address-part patterns', () => {
    const filter = new SiteFilter({
      patterns: {
        block: ['banner*^']
      }
    })

    expect(filter.shouldBlock('https://example.com/assets/banner.jpg')).toBe(true)
    expect(filter.shouldBlock('https://example.com/assets/image.jpg')).toBe(false)
  })

  it('blocks by domain name using Adblock-style anchors', () => {
    const filter = new SiteFilter({
      patterns: {
        block: ['||example.com^']
      }
    })

    expect(filter.shouldBlock('https://example.com/path')).toBe(true)
    expect(filter.shouldBlock('https://sub.example.com/asset.js')).toBe(true)
    expect(filter.shouldBlock('https://malicious-example.com/asset.js')).toBe(false)
  })

  it('blocks exact addresses with anchors', () => {
    const filter = new SiteFilter({
      patterns: {
        block: ['|https://example.com/script.js|']
      }
    })

    expect(filter.shouldBlock('https://example.com/script.js')).toBe(true)
    expect(filter.shouldBlock('https://example.com/script.js?cache=1')).toBe(false)
    expect(filter.shouldBlock('https://example.com/other.js')).toBe(false)
  })
})
  it('handles Adblock-style address-part filters', () => {
    const filter = new SiteFilter({
      patterns: {
        block: ['/banner/*/img^']
      }
    })

    expect(filter.shouldBlock('http://example.com/banner/foo/img')).toBe(true)
    expect(filter.shouldBlock('http://example.com/banner/foo/bar/img?param')).toBe(true)
    expect(filter.shouldBlock('http://example.com/banner//img/foo')).toBe(true)

    expect(filter.shouldBlock('http://example.com/banner/img')).toBe(false)
    expect(filter.shouldBlock('http://example.com/banner/foo/imgraph')).toBe(false)
    expect(filter.shouldBlock('http://example.com/banner/foo/img.gif')).toBe(false)
  })

  it('handles Adblock-style domain filters', () => {
    const filter = new SiteFilter({
      patterns: {
        block: ['||ads.example.com^']
      }
    })

    expect(filter.shouldBlock('http://ads.example.com/foo.gif')).toBe(true)
    expect(filter.shouldBlock('http://server1.ads.example.com/foo.gif')).toBe(true)
    expect(filter.shouldBlock('https://ads.example.com:8000/')).toBe(true)

    expect(filter.shouldBlock('http://ads.example.com.ua/foo.gif')).toBe(false)
    expect(filter.shouldBlock('http://example.com/redirect/http://ads.example.com/')).toBe(false)
  })

  it('handles Adblock-style exact address filters', () => {
    const filter = new SiteFilter({
      patterns: {
        block: ['|http://example.com/|']
      }
    })

    expect(filter.shouldBlock('http://example.com/')).toBe(true)
    expect(filter.shouldBlock('http://example.com/foo.gif')).toBe(false)
    expect(filter.shouldBlock('http://example.info/redirect/http://example.com/')).toBe(false)
  })
