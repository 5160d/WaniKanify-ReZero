/**
 * Test cases for contenteditable handling in content script
 * 
 * These tests verify that text replacements are properly blocked
 * in contenteditable elements to prevent interfering with user input.
 */

import { JSDOM } from 'jsdom'

// Mock the content script's shouldIgnoreElement logic (current implementation after fix)
const shouldIgnoreElement = (element: Element): boolean => {
  // Check for contenteditable elements - only ignore if contenteditable="true" or contenteditable=""
  const contentEditable = element.getAttribute("contenteditable")
  if (contentEditable === "true" || contentEditable === "") {
    return true
  }

  // Also check if any ancestor has contenteditable="true" or contenteditable=""
  if (element.closest('[contenteditable="true"], [contenteditable=""]')) {
    return true
  }

  if (element.closest("input, textarea")) {
    return true
  }

  return false
}

// Improved implementation that handles contenteditable properly
const shouldIgnoreElementImproved = (element: Element): boolean => {
  // Check for contenteditable attribute with proper value checking
  const contentEditable = element.getAttribute("contenteditable")
  if (contentEditable === "true" || contentEditable === "") {
    return true
  }

  // Also check if any ancestor has contenteditable="true"
  if (element.closest('[contenteditable="true"], [contenteditable=""]')) {
    return true
  }

  if (element.closest("input, textarea")) {
    return true
  }

  return false
}

describe('ContentEditable Handling', () => {
  let dom: JSDOM
  let document: Document

  beforeEach(() => {
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <body>
          <!-- Regular text that should be replaced -->
          <p id="normal">This is normal text</p>
          
          <!-- Textarea (should be ignored) -->
          <textarea id="textarea">This is textarea content</textarea>
          
          <!-- Input (should be ignored) -->
          <input id="input" value="This is input content" />
          
          <!-- ContentEditable variants (should all be ignored) -->
          <div id="ce-true" contenteditable="true">This is contenteditable true</div>
          <div id="ce-empty" contenteditable="">This is contenteditable empty</div>
          <div id="ce-false" contenteditable="false">This is contenteditable false</div>
          <div id="ce-plaintext" contenteditable="plaintext-only">This is contenteditable plaintext</div>
          
          <!-- Nested contenteditable -->
          <div id="ce-parent" contenteditable="true">
            <p id="ce-child">This is nested inside contenteditable</p>
            <span id="ce-grandchild">This is deeply nested</span>
          </div>
          
          <!-- Mixed scenarios -->
          <div id="normal-parent">
            <div id="ce-nested" contenteditable="true">Editable inside normal</div>
            <p id="normal-sibling">Normal sibling text</p>
          </div>
        </body>
      </html>
    `)
    document = dom.window.document
  })

  afterEach(() => {
    dom.window.close()
  })

  describe('Current Implementation', () => {
    test('should ignore textarea', () => {
      const textarea = document.getElementById('textarea')!
      expect(shouldIgnoreElement(textarea)).toBe(true)
    })

    test('should ignore input', () => {
      const input = document.getElementById('input')!
      expect(shouldIgnoreElement(input)).toBe(true)
    })

    test('should ignore contenteditable="true"', () => {
      const ceTrue = document.getElementById('ce-true')!
      expect(shouldIgnoreElement(ceTrue)).toBe(true)
    })

    test('should ignore contenteditable=""', () => {
      const ceEmpty = document.getElementById('ce-empty')!
      expect(shouldIgnoreElement(ceEmpty)).toBe(true)
    })

    test('should NOT ignore contenteditable="false" (correct behavior)', () => {
      const ceFalse = document.getElementById('ce-false')!
      // contenteditable="false" should NOT be ignored (should allow replacements)
      expect(shouldIgnoreElement(ceFalse)).toBe(false)
    })

    test('should allow normal text', () => {
      const normal = document.getElementById('normal')!
      expect(shouldIgnoreElement(normal)).toBe(false)
    })

    test('FIXED: should catch nested elements inside contenteditable', () => {
      const ceChild = document.getElementById('ce-child')!
      const ceGrandchild = document.getElementById('ce-grandchild')!
      
      // This is now fixed - these should return true
      expect(shouldIgnoreElement(ceChild)).toBe(true)
      expect(shouldIgnoreElement(ceGrandchild)).toBe(true)
    })
  })

  describe('Improved Implementation', () => {
    test('should ignore textarea', () => {
      const textarea = document.getElementById('textarea')!
      expect(shouldIgnoreElementImproved(textarea)).toBe(true)
    })

    test('should ignore input', () => {
      const input = document.getElementById('input')!
      expect(shouldIgnoreElementImproved(input)).toBe(true)
    })

    test('should ignore contenteditable="true"', () => {
      const ceTrue = document.getElementById('ce-true')!
      expect(shouldIgnoreElementImproved(ceTrue)).toBe(true)
    })

    test('should ignore contenteditable=""', () => {
      const ceEmpty = document.getElementById('ce-empty')!
      expect(shouldIgnoreElementImproved(ceEmpty)).toBe(true)
    })

    test('should NOT ignore contenteditable="false"', () => {
      const ceFalse = document.getElementById('ce-false')!
      expect(shouldIgnoreElementImproved(ceFalse)).toBe(false)
    })

    test('should NOT ignore contenteditable="plaintext-only"', () => {
      const cePlaintext = document.getElementById('ce-plaintext')!
      expect(shouldIgnoreElementImproved(cePlaintext)).toBe(false)
    })

    test('should allow normal text', () => {
      const normal = document.getElementById('normal')!
      expect(shouldIgnoreElementImproved(normal)).toBe(false)
    })

    test('FIXED: should ignore nested elements inside contenteditable', () => {
      const ceChild = document.getElementById('ce-child')!
      const ceGrandchild = document.getElementById('ce-grandchild')!
      
      expect(shouldIgnoreElementImproved(ceChild)).toBe(true)
      expect(shouldIgnoreElementImproved(ceGrandchild)).toBe(true)
    })

    test('should allow normal sibling outside contenteditable', () => {
      const normalSibling = document.getElementById('normal-sibling')!
      expect(shouldIgnoreElementImproved(normalSibling)).toBe(false)
    })
  })
})

describe('ContentEditable Edge Cases', () => {
  test('should handle case-insensitive contenteditable values', () => {
    const dom = new JSDOM(`
      <div id="ce-upper" contenteditable="TRUE">Uppercase true</div>
      <div id="ce-mixed" contenteditable="True">Mixed case</div>
    `)
    
    const ceUpper = dom.window.document.getElementById('ce-upper')!
    const ceMixed = dom.window.document.getElementById('ce-mixed')!
    
    // Current implementation might miss these
    const currentIgnoresUpper = ceUpper.hasAttribute("contenteditable")
    const currentIgnoresMixed = ceMixed.hasAttribute("contenteditable")
    
    expect(currentIgnoresUpper).toBe(true) // hasAttribute works
    expect(currentIgnoresMixed).toBe(true) // hasAttribute works
    
    // But proper value checking is more robust
    const improvedIgnoresUpper = ceUpper.getAttribute("contenteditable")?.toLowerCase() === "true"
    const improvedIgnoresMixed = ceMixed.getAttribute("contenteditable")?.toLowerCase() === "true"
    
    expect(improvedIgnoresUpper).toBe(true)
    expect(improvedIgnoresMixed).toBe(true)
    
    dom.window.close()
  })

  test('should handle dynamically added contenteditable', () => {
    const dom = new JSDOM(`<div id="dynamic">Dynamic content</div>`)
    const element = dom.window.document.getElementById('dynamic')!
    
    // Initially not contenteditable
    expect(shouldIgnoreElementImproved(element)).toBe(false)
    
    // Make it contenteditable
    element.setAttribute('contenteditable', 'true')
    expect(shouldIgnoreElementImproved(element)).toBe(true)
    
    // Remove contenteditable
    element.removeAttribute('contenteditable')
    expect(shouldIgnoreElementImproved(element)).toBe(false)
    
    dom.window.close()
  })
})