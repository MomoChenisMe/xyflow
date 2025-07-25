import { test, expect } from '@playwright/test';

test.describe('Debug XYHandle.isValid Detailed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
  });

  test('should debug isValid function step by step', async ({ page }) => {
    // Inject debugging code directly into XYHandle.isValid
    await page.addInitScript(() => {
      // Override XYHandle.isValid to add detailed logging
      window.originalIsValid = null;
      
      // Wait for XYHandle to be available and then patch it
      const patchIsValid = () => {
        try {
          const XYHandle = (window as any).XYHandle || (globalThis as any).XYHandle;
          if (XYHandle && XYHandle.isValid && !window.originalIsValid) {
            window.originalIsValid = XYHandle.isValid;
            
            XYHandle.isValid = function(event, params) {
              console.log('=== XYHandle.isValid DETAILED DEBUG ===');
              console.log('Event:', event);
              console.log('Params:', params);
              
              const { handle, connectionMode, fromNodeId, fromHandleId, fromType, doc, lib, flowId, isValidConnection, nodeLookup } = params;
              
              console.log('Step 1 - Parameters check:', {
                hasHandle: !!handle,
                handle: handle,
                connectionMode,
                fromNodeId,
                fromHandleId,
                fromType,
                lib,
                flowId,
                hasDoc: !!doc,
                hasNodeLookup: !!nodeLookup,
                nodeLookupSize: nodeLookup?.size
              });
              
              const isTarget = fromType === 'target';
              console.log('Step 2 - isTarget:', isTarget);
              
              // Try to find handle DOM node
              const handleDomQuery = handle 
                ? `.${lib}-flow__handle[data-id="${flowId}-${handle?.nodeId}-${handle?.id}-${handle?.type}"]`
                : null;
              console.log('Step 3 - DOM query:', handleDomQuery);
              
              const handleDomNode = handle ? doc.querySelector(handleDomQuery) : null;
              console.log('Step 4 - handleDomNode found:', !!handleDomNode, handleDomNode);
              
              // Check elementFromPoint
              const { x, y } = event.clientX !== undefined ? { x: event.clientX, y: event.clientY } : { x: 0, y: 0 };
              console.log('Step 5 - Event position:', { x, y });
              
              const handleBelow = doc.elementFromPoint(x, y);
              console.log('Step 6 - elementFromPoint result:', handleBelow);
              console.log('Step 7 - handleBelow classes:', handleBelow?.className);
              console.log('Step 8 - handleBelow contains handle class:', handleBelow?.classList.contains(`${lib}-flow__handle`));
              
              const handleToCheck = handleBelow?.classList.contains(`${lib}-flow__handle`) ? handleBelow : handleDomNode;
              console.log('Step 9 - handleToCheck:', handleToCheck);
              
              if (!handleToCheck) {
                console.log('Step 10 - No handle to check, returning false result');
                return {
                  handleDomNode: null,
                  isValid: false,
                  connection: null,
                  toHandle: null,
                };
              }
              
              // Get handle attributes
              const handleType = handleToCheck.classList.contains('target') ? 'target' : 
                               handleToCheck.classList.contains('source') ? 'source' : null;
              const handleNodeId = handleToCheck.getAttribute('data-nodeid');
              const handleId = handleToCheck.getAttribute('data-handleid');
              const connectable = handleToCheck.classList.contains('connectable');
              const connectableEnd = handleToCheck.classList.contains('connectableend');
              
              console.log('Step 11 - Handle attributes:', {
                handleType,
                handleNodeId,
                handleId,
                connectable,
                connectableEnd,
                classes: handleToCheck.className
              });
              
              if (!handleNodeId || !handleType) {
                console.log('Step 12 - Missing nodeId or handleType, returning false');
                return {
                  handleDomNode: handleToCheck,
                  isValid: false,
                  connection: null,
                  toHandle: null,
                };
              }
              
              // Create connection
              const connection = {
                source: isTarget ? handleNodeId : fromNodeId,
                sourceHandle: isTarget ? handleId : fromHandleId,
                target: isTarget ? fromNodeId : handleNodeId,
                targetHandle: isTarget ? fromHandleId : handleId,
              };
              
              console.log('Step 13 - Connection object:', connection);
              
              const isConnectable = connectable && connectableEnd;
              console.log('Step 14 - isConnectable:', isConnectable);
              
              // Connection mode validation
              let isModeValid = false;
              if (connectionMode === 'strict') {
                isModeValid = (isTarget && handleType === 'source') || (!isTarget && handleType === 'target');
              } else {
                isModeValid = handleNodeId !== fromNodeId || handleId !== fromHandleId;
              }
              
              console.log('Step 15 - Mode validation:', {
                connectionMode,
                isTarget,
                handleType,
                fromType,
                isModeValid
              });
              
              const isValid = isConnectable && isModeValid;
              console.log('Step 16 - Base validity:', isValid);
              
              let finalValid = false;
              if (isValid) {
                try {
                  finalValid = isValidConnection ? isValidConnection(connection) : true;
                  console.log('Step 17 - isValidConnection result:', finalValid);
                } catch (error) {
                  console.log('Step 17 - isValidConnection error:', error);
                  finalValid = false;
                }
              }
              
              // Try to get toHandle
              let toHandle = null;
              try {
                // This should match the getHandle function logic
                const node = nodeLookup.get(handleNodeId);
                console.log('Step 18 - Node from lookup:', !!node, node?.id);
                
                if (node) {
                  const handles = connectionMode === 'strict'
                    ? node.internals.handleBounds?.[handleType]
                    : [...(node.internals.handleBounds?.source ?? []), ...(node.internals.handleBounds?.target ?? [])];
                  
                  console.log('Step 19 - Available handles:', handles?.length, handles);
                  
                  toHandle = (handleId ? handles?.find((h) => h.id === handleId) : handles?.[0]) ?? null;
                  console.log('Step 20 - toHandle found:', !!toHandle, toHandle);
                }
              } catch (error) {
                console.log('Step 18-20 - Error getting toHandle:', error);
              }
              
              const result = {
                handleDomNode: handleToCheck,
                isValid: finalValid,
                connection: finalValid ? connection : null,
                toHandle,
              };
              
              console.log('=== FINAL RESULT ===', result);
              return result;
            };
            
            console.log('XYHandle.isValid patched successfully');
          }
        } catch (error) {
          console.log('Error patching XYHandle:', error);
        }
      };
      
      // Try to patch immediately and also set up interval
      patchIsValid();
      const interval = setInterval(() => {
        patchIsValid();
        if (window.originalIsValid) {
          clearInterval(interval);
        }
      }, 100);
    });

    await page.waitForTimeout(1000);

    // Try click connection
    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);
    
    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Starting connection test...');
      
      // Click source
      await sourceHandle.click();
      await page.waitForTimeout(300);
      
      // Click target  
      await targetHandle.click();
      await page.waitForTimeout(500);
    }
  });
});