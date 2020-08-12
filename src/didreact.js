function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child =>
        typeof child === "object"
          ? child
          : createTextElement(child)
      ),
    },
  }
}


function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  }
}


function createDOM(fiber) {
  const dom =
    fiber.type === 'TEXT_ELEMENT' ?
      document.createTextNode("") :
      document.createElement(fiber.type)
  
  Object
    .keys(fiber.props)
    .filter(isProperty)
    .forEach(name =>
      dom[name] = fiber.props[name]
  );

  return dom
}

function render(element, container) {
  // set nextUnitOfWork to the root of the dom tree
  wipRoot = {
    dom: container,
    props: {
      children: [element]
    },
    alternate: currentRoot
  }
  deletions = []
  nextUnitOfWork = wipRoot
}

let nextUnitOfWork = null;
let wipRoot = null
let currentRoot = null
let deletions = null

function commitRoot() {
  commitRoot(wipRoot)
  currentRoot = wipRoot
  wipRoot = null
}

const isEvent = key => key.startsWith('on')
const isProperty = key => key !== 'children' && !isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key]
const isGone = (prev, next) => key => !(key in next)

function updateDOM(dom, prevProps, nextProps) {
  
 Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||
        isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })
}

function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  if (fiber.effectionTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effctionTag === 'UPDATE' && fiber.dom !== null) {
    updateDOM(fiber.dom, fiber.alternate.props, fiber.props)
  } else if (fiber.effectionTag === 'DELETION') {
    domParent.removeChild(fiber.dom)
  }
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDOM(fiber)
  }
  // create new fibers

  const elements = fiber.props.children
  reconcileChildren(fiber, elements)

  // return nextUnitOfWork
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sbling) {
      return nextFiber.sibling
    } 
    nextFiber = nextFiber.parent
  }
}

function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber = wipRoot.alternate && wipRoot.alternate.child
  let prevSibling = null
  while (index < elements.length || oldFiber !== null) {
    const element = elements[index];

    let newFiber = null
    
    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        alternate: oldFiber,
        dom: oldFiber.dom,
        effectTag: "UPDATE",
      }
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT",
      }
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)
      
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    

    if (index === 0) {
      wipFiber.child = newFiber
    } else {
      prevSibling.sbling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

const Didact = {
  createElement,
  render
}

export default Didact