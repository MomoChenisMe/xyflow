import { test, expect } from '@playwright/test';

test.describe('Debug XYHandle Steps', () => {
  test('should patch XYHandle.isValid to show detailed steps', async ({ page }) => {
    const logs: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    // Inject detailed XYHandle.isValid debugging
    await page.addInitScript(() => {
      // Override XYHandle.isValid to add step-by-step debugging
      let originalIsValid: any = null;
      
      const patchXYHandle = () => {
        try {
          // Try to find XYHandle in various possible locations
          const possibleLocations = [
            (window as any).XYHandle,
            (globalThis as any).XYHandle,
            (window as any).xyflow?.XYHandle,
            (window as any)['@xyflow/system']?.XYHandle
          ];
          
          for (const XYHandle of possibleLocations) {
            if (XYHandle && XYHandle.isValid && !originalIsValid) {
              originalIsValid = XYHandle.isValid;
              
              XYHandle.isValid = function(event: any, params: any) {
                console.log('🔍 === XYHandle.isValid DETAILED STEPS ===');
                console.log('🔍 Step 1 - Input parameters:', {
                  eventType: event?.type,
                  eventTarget: event?.target?.className,
                  handle: params?.handle,
                  connectionMode: params?.connectionMode,
                  fromNodeId: params?.fromNodeId,
                  fromHandleId: params?.fromHandleId,
                  fromType: params?.fromType,
                  lib: params?.lib,
                  flowId: params?.flowId,
                  hasNodeLookup: !!params?.nodeLookup,
                  nodeLookupSize: params?.nodeLookup?.size
                });
                
                const { handle, connectionMode, fromNodeId, fromHandleId, fromType, doc, lib, flowId, isValidConnection, nodeLookup } = params;
                
                // Step 2: Determine if this is a target connection
                const isTarget = fromType === 'target';
                console.log('🔍 Step 2 - Connection direction:', { isTarget, fromType });
                
                // Step 3: Find handle DOM node
                const handleDomQuery = handle 
                  ? `.${lib}-flow__handle[data-id="${flowId}-${handle?.nodeId}-${handle?.id}-${handle?.type}"]`
                  : null;
                console.log('🔍 Step 3 - DOM query string:', handleDomQuery);
                
                const handleDomNode = handle ? doc.querySelector(handleDomQuery) : null;
                console.log('🔍 Step 4 - HandleDomNode found:', {
                  found: !!handleDomNode,
                  className: handleDomNode?.className,
                  dataId: handleDomNode?.getAttribute('data-id'),
                  dataNodeId: handleDomNode?.getAttribute('data-nodeid'),
                  dataHandleId: handleDomNode?.getAttribute('data-handleid')
                });

                // Step 5: Check elementFromPoint
                const { x, y } = event.clientX !== undefined 
                  ? { x: event.clientX, y: event.clientY } 
                  : { x: 0, y: 0 };
                console.log('🔍 Step 5 - Event coordinates:', { x, y });
                
                const handleBelow = doc.elementFromPoint(x, y);
                console.log('🔍 Step 6 - Element from point:', {
                  found: !!handleBelow,
                  className: handleBelow?.className,
                  isHandle: handleBelow?.classList?.contains(`${lib}-flow__handle`)
                });

                // Step 7: Determine which handle to check
                const handleToCheck = handleBelow?.classList.contains(`${lib}-flow__handle`) ? handleBelow : handleDomNode;
                console.log('🔍 Step 7 - Handle to check:', {
                  using: handleToCheck === handleBelow ? 'elementFromPoint' : handleToCheck === handleDomNode ? 'domQuery' : 'none',
                  hasHandle: !!handleToCheck
                });

                if (!handleToCheck) {
                  console.log('🔍 Step 8 - EARLY RETURN: No handle to check');
                  return {
                    handleDomNode: null,
                    isValid: false,
                    connection: null,
                    toHandle: null,
                  };
                }

                // Step 8: Extract handle attributes
                const handleType = handleToCheck.classList.contains('target') ? 'target' : 
                                 handleToCheck.classList.contains('source') ? 'source' : null;
                const handleNodeId = handleToCheck.getAttribute('data-nodeid');
                const handleId = handleToCheck.getAttribute('data-handleid');
                const connectable = handleToCheck.classList.contains('connectable');
                const connectableEnd = handleToCheck.classList.contains('connectableend');
                
                console.log('🔍 Step 8 - Handle attributes:', {
                  handleType,
                  handleNodeId,
                  handleId,
                  connectable,
                  connectableEnd,
                  allClasses: handleToCheck.className
                });

                if (!handleNodeId || !handleType) {
                  console.log('🔍 Step 9 - EARLY RETURN: Missing nodeId or handleType');
                  return {
                    handleDomNode: handleToCheck,
                    isValid: false,
                    connection: null,
                    toHandle: null,
                  };
                }

                // Step 9: Create connection object
                const connection = {
                  source: isTarget ? handleNodeId : fromNodeId,
                  sourceHandle: isTarget ? handleId : fromHandleId,
                  target: isTarget ? fromNodeId : handleNodeId,
                  targetHandle: isTarget ? fromHandleId : handleId,
                };
                console.log('🔍 Step 9 - Connection object:', connection);

                // Step 10: Check connectivity
                const isConnectable = connectable && connectableEnd;
                console.log('🔍 Step 10 - Connectivity check:', { connectable, connectableEnd, isConnectable });

                // Step 11: Mode validation
                let isModeValid = false;
                if (connectionMode === 'strict') {
                  isModeValid = (isTarget && handleType === 'source') || (!isTarget && handleType === 'target');
                } else {
                  isModeValid = handleNodeId !== fromNodeId || handleId !== fromHandleId;
                }
                console.log('🔍 Step 11 - Mode validation:', {
                  connectionMode,
                  isTarget,
                  handleType,
                  fromType,
                  condition1: isTarget && handleType === 'source',
                  condition2: !isTarget && handleType === 'target',
                  isModeValid
                });

                // Step 12: Combined validity
                const baseValid = isConnectable && isModeValid;
                console.log('🔍 Step 12 - Base validity:', { baseValid });

                // Step 13: Custom validation
                let finalValid = false;
                if (baseValid) {
                  try {
                    finalValid = isValidConnection ? isValidConnection(connection) : true;
                    console.log('🔍 Step 13 - Custom validation result:', finalValid);
                  } catch (error) {
                    console.log('🔍 Step 13 - Custom validation error:', error);
                    finalValid = false;
                  }
                } else {
                  console.log('🔍 Step 13 - Skipped custom validation (base invalid)');
                }

                // Step 14: Get toHandle
                let toHandle = null;
                try {
                  const node = nodeLookup?.get(handleNodeId);
                  console.log('🔍 Step 14 - Node lookup:', {
                    nodeId: handleNodeId,
                    nodeFound: !!node,
                    hasHandleBounds: !!node?.internals?.handleBounds
                  });
                  
                  if (node) {
                    const handles = connectionMode === 'strict'
                      ? node.internals.handleBounds?.[handleType]
                      : [...(node.internals.handleBounds?.source ?? []), ...(node.internals.handleBounds?.target ?? [])];
                    
                    console.log('🔍 Step 15 - Available handles:', {
                      handleType,
                      handlesCount: handles?.length,
                      handleId,
                      handles: handles?.map(h => ({ id: h.id, type: h.type }))
                    });
                    
                    toHandle = (handleId ? handles?.find((h: any) => h.id === handleId) : handles?.[0]) ?? null;
                    console.log('🔍 Step 16 - ToHandle result:', { found: !!toHandle, toHandle });
                  }
                } catch (error) {
                  console.log('🔍 Step 14-16 - Error getting toHandle:', error);
                }

                const result = {
                  handleDomNode: handleToCheck,
                  isValid: finalValid,
                  connection: finalValid ? connection : null,
                  toHandle,
                };

                console.log('🔍 === FINAL RESULT ===', {
                  isValid: result.isValid,
                  hasConnection: !!result.connection,
                  hasToHandle: !!result.toHandle,
                  result
                });
                
                return result;
              };
              
              console.log('✅ XYHandle.isValid successfully patched for detailed debugging');
              return;
            }
          }
          
          console.log('❌ Could not find XYHandle.isValid to patch');
        } catch (error) {
          console.log('❌ Error patching XYHandle:', error);
        }
      };
      
      // Try to patch immediately and also set up interval
      patchXYHandle();
      const interval = setInterval(() => {
        patchXYHandle();
        if (originalIsValid) {
          clearInterval(interval);
        }
      }, 100);
      
      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(interval), 10000);
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    const sourceHandle = page.locator('.xy-flow__handle.source').first();
    const targetHandle = page.locator('.xy-flow__handle.target').nth(1);

    if (await sourceHandle.isVisible() && await targetHandle.isVisible()) {
      console.log('Testing connection with detailed XYHandle debugging...');
      
      // Click source
      await sourceHandle.click();
      await page.waitForTimeout(300);
      
      // Click target  
      await targetHandle.click();
      await page.waitForTimeout(500);
    }

    // Filter for XYHandle debugging logs
    const xyhandleLogs = logs.filter(log => 
      log.includes('🔍') || 
      log.includes('XYHandle.isValid') ||
      log.includes('=== FINAL RESULT ===')
    );

    console.log('\n=== XYHANDLE DETAILED DEBUGGING ===');
    xyhandleLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    console.log('=== END XYHANDLE DEBUGGING ===\n');
  });
});