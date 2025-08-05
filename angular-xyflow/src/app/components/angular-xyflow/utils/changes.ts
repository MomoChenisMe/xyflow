import { 
  NodeChange, 
  EdgeChange, 
  AngularNode, 
  AngularEdge,
  NodeAddChange,
  NodeRemoveChange,
  NodeReplaceChange,
  NodeSelectionChange,
  NodePositionChange,
  NodeDimensionChange,
  EdgeAddChange,
  EdgeRemoveChange,
  EdgeReplaceChange,
  EdgeSelectionChange
} from '../types';

// 應用節點變更 - 與 React Flow 的 applyNodeChanges 對應
export function applyNodeChanges<NodeType extends AngularNode = AngularNode>(
  changes: NodeChange<NodeType>[],
  nodes: NodeType[]
): NodeType[] {
  const nodesCopy = [...nodes];
  const nodesMap = new Map<string, NodeType>();
  
  // 建立節點映射以便快速查找
  nodesCopy.forEach(node => nodesMap.set(node.id, node));

  for (const change of changes) {
    switch (change.type) {
      case 'add': {
        const addChange = change as NodeAddChange<NodeType>;
        if (addChange.index !== undefined && addChange.index >= 0 && addChange.index <= nodesCopy.length) {
          nodesCopy.splice(addChange.index, 0, addChange.item);
        } else {
          nodesCopy.push(addChange.item);
        }
        nodesMap.set(addChange.item.id, addChange.item);
        break;
      }

      case 'remove': {
        const removeChange = change as NodeRemoveChange;
        const index = nodesCopy.findIndex(n => n.id === removeChange.id);
        if (index !== -1) {
          nodesCopy.splice(index, 1);
          nodesMap.delete(removeChange.id);
        }
        break;
      }

      case 'replace': {
        const replaceChange = change as NodeReplaceChange<NodeType>;
        const index = nodesCopy.findIndex(n => n.id === replaceChange.id);
        if (index !== -1) {
          nodesCopy[index] = replaceChange.item;
          nodesMap.set(replaceChange.id, replaceChange.item);
        }
        break;
      }

      case 'select': {
        const selectChange = change as NodeSelectionChange;
        const node = nodesMap.get(selectChange.id);
        if (node) {
          const index = nodesCopy.findIndex(n => n.id === selectChange.id);
          if (index !== -1) {
            nodesCopy[index] = {
              ...node,
              selected: selectChange.selected
            };
            nodesMap.set(selectChange.id, nodesCopy[index]);
          }
        }
        break;
      }

      case 'position': {
        const positionChange = change as NodePositionChange;
        const node = nodesMap.get(positionChange.id);
        if (node) {
          const index = nodesCopy.findIndex(n => n.id === positionChange.id);
          if (index !== -1) {
            const updates: Partial<NodeType> = {};
            
            if (positionChange.position !== undefined) {
              updates.position = positionChange.position;
            }
            
            if (positionChange.dragging !== undefined) {
              updates.dragging = positionChange.dragging;
            }

            nodesCopy[index] = {
              ...node,
              ...updates
            };
            nodesMap.set(positionChange.id, nodesCopy[index]);
          }
        }
        break;
      }

      case 'dimensions': {
        const dimensionChange = change as NodeDimensionChange;
        const node = nodesMap.get(dimensionChange.id);
        if (node) {
          const index = nodesCopy.findIndex(n => n.id === dimensionChange.id);
          if (index !== -1) {
            const updates: Partial<NodeType> = {};
            
            if (dimensionChange.dimensions) {
              // 如果設置了 setAttributes，更新實際尺寸
              if (dimensionChange.setAttributes) {
                if (dimensionChange.setAttributes === true || dimensionChange.setAttributes === 'width') {
                  updates.width = dimensionChange.dimensions.width;
                }
                if (dimensionChange.setAttributes === true || dimensionChange.setAttributes === 'height') {
                  updates.height = dimensionChange.dimensions.height;
                }
              }
              
              // 總是更新測量尺寸
              updates.measured = dimensionChange.dimensions;
            }

            nodesCopy[index] = {
              ...node,
              ...updates
            };
            nodesMap.set(dimensionChange.id, nodesCopy[index]);
          }
        }
        break;
      }
    }
  }

  return nodesCopy;
}

// 應用邊變更 - 與 React Flow 的 applyEdgeChanges 對應
export function applyEdgeChanges<EdgeType extends AngularEdge = AngularEdge>(
  changes: EdgeChange<EdgeType>[],
  edges: EdgeType[]
): EdgeType[] {
  const edgesCopy = [...edges];
  const edgesMap = new Map<string, EdgeType>();
  
  // 建立邊映射以便快速查找
  edgesCopy.forEach(edge => edgesMap.set(edge.id, edge));

  for (const change of changes) {
    switch (change.type) {
      case 'add': {
        const addChange = change as EdgeAddChange<EdgeType>;
        if (addChange.index !== undefined && addChange.index >= 0 && addChange.index <= edgesCopy.length) {
          edgesCopy.splice(addChange.index, 0, addChange.item);
        } else {
          edgesCopy.push(addChange.item);
        }
        edgesMap.set(addChange.item.id, addChange.item);
        break;
      }

      case 'remove': {
        const removeChange = change as EdgeRemoveChange;
        const index = edgesCopy.findIndex(e => e.id === removeChange.id);
        if (index !== -1) {
          edgesCopy.splice(index, 1);
          edgesMap.delete(removeChange.id);
        }
        break;
      }

      case 'replace': {
        const replaceChange = change as EdgeReplaceChange<EdgeType>;
        const index = edgesCopy.findIndex(e => e.id === replaceChange.id);
        if (index !== -1) {
          edgesCopy[index] = replaceChange.item;
          edgesMap.set(replaceChange.id, replaceChange.item);
        }
        break;
      }

      case 'select': {
        const selectChange = change as EdgeSelectionChange;
        const edge = edgesMap.get(selectChange.id);
        if (edge) {
          const index = edgesCopy.findIndex(e => e.id === selectChange.id);
          if (index !== -1) {
            edgesCopy[index] = {
              ...edge,
              selected: selectChange.selected
            };
            edgesMap.set(selectChange.id, edgesCopy[index]);
          }
        }
        break;
      }
    }
  }

  return edgesCopy;
}

// Helper function to create selection changes for nodes
export function createNodeSelectionChanges(
  nodeIds: string[],
  selected: boolean
): NodeSelectionChange[] {
  return nodeIds.map(id => ({
    type: 'select' as const,
    id,
    selected
  }));
}

// Helper function to create selection changes for edges
export function createEdgeSelectionChanges(
  edgeIds: string[],
  selected: boolean
): EdgeSelectionChange[] {
  return edgeIds.map(id => ({
    type: 'select' as const,
    id,
    selected
  }));
}