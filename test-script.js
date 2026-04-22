/**
 * Local Testing Script for Family Tree Application
 * Run this in browser console to perform automated tests
 */

class FamilyTreeTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(testName, status, message) {
    const result = {
      test: testName,
      status: status, // 'PASS', 'FAIL', 'WARN', 'INFO'
      message: message,
      timestamp: new Date().toISOString()
    };
    this.results.push(result);
    
    const color = {
      'PASS': 'color: green',
      'FAIL': 'color: red', 
      'WARN': 'color: orange',
      'INFO': 'color: blue'
    }[status] || '';
    
    console.log(`%c[${status}] ${testName}: ${message}`, color);
  }

  // Test DOM elements exist
  testDOMElements() {
    const elements = [
      { id: 'tree-svg', name: 'Tree SVG' },
      { id: 'left-sidebar', name: 'Left Sidebar' },
      { id: 'btn-sign-in', name: 'Sign In Button' },
      { id: 'edit-modal', name: 'Edit Modal' },
      { id: 'member-form', name: 'Member Form' }
    ];

    elements.forEach(({ id, name }) => {
      const element = document.getElementById(id);
      if (element) {
        this.log('DOM Elements', 'PASS', `${name} exists`);
      } else {
        this.log('DOM Elements', 'FAIL', `${name} missing`);
      }
    });
  }

  // Test form field names
  testFormFields() {
    const nameLabel = document.querySelector('label[for="f-name"], label:has(#f-name)');
    const chineseLabel = document.querySelector('label[for="f-chinese"], label:has(#f-chinese)');
    
    if (nameLabel && nameLabel.textContent.includes('Chinese Name')) {
      this.log('Form Fields', 'PASS', 'Chinese Name field labeled correctly');
    } else {
      this.log('Form Fields', 'FAIL', 'Chinese Name field not found or incorrectly labeled');
    }
    
    if (chineseLabel && chineseLabel.textContent.includes('Nickname')) {
      this.log('Form Fields', 'PASS', 'Nickname field labeled correctly');
    } else {
      this.log('Form Fields', 'FAIL', 'Nickname field not found or incorrectly labeled');
    }

    // Check that spouse input field is removed
    const spouseInput = document.getElementById('f-spouse');
    if (!spouseInput) {
      this.log('Form Fields', 'PASS', 'Spouse input field correctly removed');
    } else {
      this.log('Form Fields', 'FAIL', 'Spouse input field still exists (should be removed)');
    }
  }

  // Test tree rendering
  testTreeRendering() {
    const treeGroup = document.getElementById('tree-group');
    if (!treeGroup) {
      this.log('Tree Rendering', 'FAIL', 'Tree group not found');
      return;
    }

    const nodes = treeGroup.querySelectorAll('.node');
    const links = treeGroup.querySelectorAll('.link');
    const marriageLinks = treeGroup.querySelectorAll('.marriage-link');

    this.log('Tree Rendering', 'INFO', `Found ${nodes.length} nodes`);
    this.log('Tree Rendering', 'INFO', `Found ${links.length} family links`);
    this.log('Tree Rendering', 'INFO', `Found ${marriageLinks.length} marriage links`);

    if (nodes.length > 0) {
      this.log('Tree Rendering', 'PASS', 'Tree has nodes');
    } else {
      this.log('Tree Rendering', 'WARN', 'No tree nodes found - may need data');
    }
  }

  // Test sidebar functionality
  testSidebar() {
    const sidebar = document.getElementById('left-sidebar');
    if (!sidebar) {
      this.log('Sidebar', 'FAIL', 'Sidebar not found');
      return;
    }

    const computedStyle = window.getComputedStyle(sidebar);
    const position = computedStyle.position;
    
    if (position === 'fixed' || position === 'absolute') {
      this.log('Sidebar', 'PASS', 'Sidebar is positioned fixed/absolute');
    } else {
      this.log('Sidebar', 'WARN', `Sidebar position is ${position} (expected fixed/absolute)`);
    }

    const historySection = document.getElementById('sidebar-history');
    if (historySection) {
      const historyStyle = window.getComputedStyle(historySection);
      if (historyStyle.overflowY === 'auto' || historyStyle.overflowY === 'scroll') {
        this.log('Sidebar', 'PASS', 'Recent Edits section is scrollable');
      } else {
        this.log('Sidebar', 'WARN', 'Recent Edits section may not be scrollable');
      }
    }
  }

  // Test for JavaScript errors
  testConsoleErrors() {
    const originalError = console.error;
    let errorCount = 0;
    
    console.error = function(...args) {
      errorCount++;
      originalError.apply(console, args);
    };

    setTimeout(() => {
      console.error = originalError;
      if (errorCount === 0) {
        this.log('Console Errors', 'PASS', 'No console errors detected');
      } else {
        this.log('Console Errors', 'FAIL', `${errorCount} console errors detected`);
      }
    }, 2000);
  }

  // Test authentication UI
  testAuthUI() {
    const signInBtn = document.getElementById('btn-sign-in');
    const signOutBtn = document.getElementById('btn-sign-out');
    const userDisplay = document.getElementById('user-display-name');

    if (signInBtn) {
      const isVisible = !signInBtn.classList.contains('hidden');
      this.log('Auth UI', isVisible ? 'INFO' : 'INFO', 
        `Sign-in button ${isVisible ? 'visible' : 'hidden'}`);
    }

    if (signOutBtn) {
      const isVisible = !signOutBtn.classList.contains('hidden');
      this.log('Auth UI', 'INFO', 
        `Sign-out button ${isVisible ? 'visible' : 'hidden'}`);
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Family Tree Test Suite...');
    console.log('=====================================');

    this.testDOMElements();
    this.testFormFields();
    this.testTreeRendering();
    this.testSidebar();
    this.testAuthUI();
    this.testConsoleErrors();

    // Wait a bit for async tests
    setTimeout(() => {
      this.generateReport();
    }, 3000);
  }

  // Generate test report
  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    console.log('\n📊 Test Report');
    console.log('===============');
    
    const summary = this.results.reduce((acc, result) => {
      acc[result.status] = (acc[result.status] || 0) + 1;
      return acc;
    }, {});

    console.log(`Total Tests: ${this.results.length}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`PASS: ${summary.PASS || 0}`);
    console.log(`FAIL: ${summary.FAIL || 0}`);
    console.log(`WARN: ${summary.WARN || 0}`);
    console.log(`INFO: ${summary.INFO || 0}`);

    if (summary.FAIL > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }

    if (summary.WARN > 0) {
      console.log('\n⚠️ Warnings:');
      this.results
        .filter(r => r.status === 'WARN')
        .forEach(r => console.log(`  - ${r.test}: ${r.message}`));
    }

    const overallStatus = summary.FAIL > 0 ? '❌ FAILED' : 
                         summary.WARN > 0 ? '⚠️ PASSED WITH WARNINGS' : 
                         '✅ ALL PASSED';
    
    console.log(`\n${overallStatus}`);
    
    return {
      summary,
      results: this.results,
      duration,
      overallStatus
    };
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.FamilyTreeTester = FamilyTreeTester;
  
  // Provide easy access
  window.runTests = function() {
    const tester = new FamilyTreeTester();
    return tester.runAllTests();
  };
  
  console.log('🧪 Family Tree Tester loaded!');
  console.log('Run tests with: runTests()');
}