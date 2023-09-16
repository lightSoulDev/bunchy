// Improved radix tree typescript implementation based on github.com/julienschmidt/httprouter (golang)

import { RouteHandlers } from "../router/router";
import * as PATH from "path";
import { Handler } from "../types";

const enum SegmentType {
  Static = 0,
  Root = 1,
  Param = 2,
  CatchAll = 3,
}

const enum CharCode {
  Hash = 35,
  Star = 42,
  Slash = 47,
  Colon = 58,
  SColon = 59,
  QMark = 63,
}

export class RouteTreeNode {
  constructor(
    private path = "",
    private indices = "",
    private wildChild = false,
    private type = SegmentType.Static,
    private priority = 0,
    private children: RouteTreeNode[] = [],

    private value: RouteHandlers | null = null
  ) {}

  private addChild(child: RouteTreeNode): RouteTreeNode {
    if (this.wildChild && this.children.length > 0) {
      //add child before last wild node
      this.children.splice(-1, 0, child);
    } else {
      this.children.push(child);
    }
    return child;
  }

  private passMiddlewares(child: RouteTreeNode): void {
    if (this.value?.middlewares) {
      if (!child.value) child.value = { middlewares: [], requestHandlers: {} };
      child.value.middlewares.unshift(...this.value.middlewares);
    }
  }

  /**
   * adds a node with the given handle to the path.
   * @param path
   * @param value
   * @returns
   */
  set(path: string, value: RouteHandlers): RouteTreeNode {
    let n: RouteTreeNode = this;
    const fullPath = path;
    n.priority++;

    if (path.endsWith("/*")) {
      path = path + "wildcard";
    }

    // Empty tree
    if (n.path.length === 0 && n.children.length === 0) {
      n.insertChild(this, path, fullPath, value);
      n.type = SegmentType.Root;
      return this;
    }

    walk: while (true) {
      // Find the longest common prefix
      // This also implies that the common prefix contains no ':' or '*'
      // since the existing key can't contain those chars.
      const i = longestCommonPrefix(path, n.path);

      // Split edge
      if (i < n.path.length) {
        const child = new RouteTreeNode(
          n.path.slice(i),
          n.indices,
          n.wildChild,
          SegmentType.Static,
          n.priority - 1,
          n.children,
          n.value
        );

        n.children = [child];
        n.indices = n.path[i];
        n.path = path.slice(0, i);
        n.value = null;
        n.wildChild = false;
      }

      // Make new node a child of this node
      if (i < path.length) {
        path = path.slice(i);
        const c = path.charCodeAt(0);

        // '/' after param
        if (n.type === SegmentType.Param && c === CharCode.Slash && n.children.length === 1) {
          n = n.children[0];
          n.priority++;
          continue walk;
        }

        // Check if a child with the next path byte exists
        for (let j = 0; j < n.indices.length; j++) {
          if (c === n.indices.charCodeAt(j)) {
            j = n.incrementChildPriority(j);
            n = n.children[j];
            continue walk;
          }
        }

        // Otherwise insert it
        if (c !== CharCode.Colon && c !== CharCode.Star && n.type !== SegmentType.CatchAll) {
          n.indices += String.fromCharCode(c);
          const child = n.addChild(
            new RouteTreeNode("", "", false, SegmentType.Static, 0, [], null)
          );
          n.incrementChildPriority(n.indices.length - 1);
          n = child;
        } else if (n.wildChild) {
          n = n.children[n.children.length - 1];
          n.priority++;

          // Check if the wildcard matches
          if (
            path.length >= n.path.length &&
            n.path === path.slice(0, n.path.length) &&
            // Adding a child to a catchAll is not possible
            n.type !== SegmentType.CatchAll &&
            // Check for longer wildcard, e.g. :name and :names
            (n.path.length >= path.length || path.charCodeAt(n.path.length) === CharCode.Slash)
          ) {
            continue walk;
          }
          // Wildcard conflict
          let pathSeg = path;
          if (n.type !== SegmentType.CatchAll) {
            const idx = path.indexOf("/");
            if (idx === -1) pathSeg = path;
            else pathSeg = path.substring(0, idx);
          }
          const prefix = fullPath.slice(0, fullPath.indexOf(pathSeg)) + n.path;
          throw new Error(
            "'" +
              pathSeg +
              "' in new path '" +
              fullPath +
              "' conflicts with existing wildcard '" +
              n.path +
              "' in existing prefix '" +
              prefix +
              "'"
          );
        }

        n.insertChild(this, path, fullPath, value);
        return this;
      }

      // Otherwise add handle to current node
      if (n.value !== null) {
        throw new Error("A handle is already registered for path '" + fullPath + "'");
      }
      n.value = value;
      return this;
    }
  }

  print(): void {
    let value = null;
    const params: Record<string, string[]> = {};

    let n: RouteTreeNode = this;
    let routePath = "/";

    let nodes = new Array<{ node: RouteTreeNode; depth: number }>({ node: n, depth: 0 });

    while (true) {
      if (nodes.length === 0) break;
      let { node, depth } = nodes.pop()!;
      const indent =
        "\x1b[2m" +
        "|  ".repeat(depth) +
        "\x1b[0m" +
        "\x1b[34m" +
        (node.children.length === 0 ? "└──" : "├──") +
        "\x1b[0m";
      // console.log("| ".repeat(depth) + indent, node.path, node.type, node.priority);
      let middlewares =
        node.value?.middlewares && node.value.middlewares.length > 0
          ? `\x1b[33m[${node.value.middlewares.length}]\x1b[0m`
          : "";
      let requestHandlers =
        node.value?.requestHandlers && Object.keys(node.value.requestHandlers)
          ? "\x1b[32m" + JSON.stringify(Object.keys(node.value.requestHandlers)) + "\x1b[0m"
          : "";
      let prefix = "";

      if (node.path !== "/" || depth === 0) {
        let text = indent + "\x1b[34m" + node.path + "\x1b[0m";
        console.log(text, middlewares + requestHandlers);
      }

      if (node.children.length > 0) {
        nodes.push(
          ...node.children.map((node) => ({ node, depth: node.path !== "/" ? depth + 1 : depth }))
        );
      }
    }
  }

  /**
   * Returns the handle registered with the given path. Any found parameters
   * are added to an array of entries
   * suitable for `Object.fromEntries` or a `Map` constructor
   * @param path
   * @returns
   */
  get(path: string): {
    value: RouteHandlers | null;
    params: Record<string, string[]>;
    routePath: string;
    allMiddlewares: Handler[];
  } {
    let value = null;
    const params: Record<string, string[]> = {};
    let n: RouteTreeNode = this;
    let routePath = "/";
    let allMiddlewares: Handler[] = n.value?.middlewares ?? [];

    walk: while (true) {
      if (path.length > n.path.length) {
        if (path.slice(0, n.path.length) === n.path) {
          path = path.slice(n.path.length);
          const c = path.charCodeAt(0);
          for (let i = 0; i < n.indices.length; i++) {
            if (c === n.indices.charCodeAt(i)) {
              n = n.children[i];
              routePath = PATH.join(routePath, n.path);
              allMiddlewares.push(...(n.value?.middlewares ?? []));
              continue walk;
            }
          }
          // If this node does not have a wildcard child,
          // we can just look up the next child node and continue
          // to walk down the tree
          if (!n.wildChild) {
            // Nothing found.
            return { value, params, routePath, allMiddlewares };
          }

          // Handle wildcard child
          n = n.children[n.children.length - 1];
          let end = 0;
          switch (n.type) {
            case SegmentType.Param:
              // Find param end (either '/' or path end)
              while (end < path.length && path.charCodeAt(end) !== CharCode.Slash) {
                end++;
              }
              routePath = PATH.join(routePath, n.path);
              allMiddlewares.push(...(n.value?.middlewares ?? []));
              // Save param value
              params[n.path.slice(1)] = params[n.path.slice(1)]
                ? [...params[n.path.slice(1)], path.slice(0, end)]
                : [path.slice(0, end)];

              // We need to go deeper!
              if (end < path.length) {
                if (n.children.length > 0) {
                  path = path.slice(end);
                  n = n.children[0];
                  routePath = PATH.join(routePath, n.path);
                  allMiddlewares.push(...(n.value?.middlewares ?? []));
                  continue walk;
                }

                // ... but we can't
                return { value, params, routePath, allMiddlewares };
              }

              value = n.value;

              return { value, params, routePath, allMiddlewares };

            case SegmentType.CatchAll:
              params[n.path.slice(2)] = params[n.path.slice(2)]
                ? [...params[n.path.slice(2)], path]
                : [path];

              value = n.value;
              return { value, params, routePath, allMiddlewares };

            default:
              throw new Error("invalid node type");
          }
        }
      } else if (path === n.path) {
        value = n.value;
      }

      return { value, params, routePath, allMiddlewares };
    }
  }

  private insertChild(parent: RouteTreeNode, path: string, fullPath: string, value: any) {
    let n: RouteTreeNode = this;
    let middlewares = parent.value?.middlewares ?? [];

    while (true) {
      // Find prefix until first wildcard
      let wild = findWildcard(path),
        { wildcard, valid } = wild;
      let { i } = wild;
      if (i < 0) {
        break;
      }

      // The wildcard name must not contain ':' and '*'
      if (!valid) {
        throw new Error(
          "only one wildcard per path segment is allowed, has: '" +
            wildcard +
            "' in path '" +
            fullPath +
            "'"
        );
      }
      // Check if the wildcard has a name
      if (wildcard.length < 2) {
        throw new Error("wildcards must be named with a non-empty name in path '" + fullPath + "'");
      }

      // param
      if (wildcard.charCodeAt(0) === CharCode.Colon) {
        if (i > 0) {
          // Insert prefix before the current wildcard
          n.path = path.slice(0, i);
          path = path.slice(i);
        }
        const child = n.addChild(
          new RouteTreeNode(wildcard, "", false, SegmentType.Param, 1, [], null)
        );
        n.wildChild = true;
        n = child;

        // If the path doesn't end with the wildcard, then there
        // will be another non-wildcard subpath starting with '/'
        if (wildcard.length < path.length) {
          path = path.slice(wildcard.length);
          n = n.addChild(new RouteTreeNode("", "", false, SegmentType.Static, 1, [], null));
          continue;
        }

        // Otherwise we're done. Insert the handle in the new leaf
        n.value = value;
        return;
      }
      // catchAll
      if (i + wildcard.length !== path.length) {
        throw new Error(
          "catch-all routes are only allowed at the end of the path in path '" + fullPath + "'"
        );
      }

      if (n.path.length > 0 && n.path.charCodeAt(n.path.length - 1) === CharCode.Slash) {
        throw new Error(
          "catch-all conflicts with existing handle for the path segment root in path '" +
            fullPath +
            "'"
        );
      }

      // Currently fixed width 1 for '/
      i--;
      if (path.charCodeAt(i) !== CharCode.Slash) {
        throw new Error("no / before catch-all in path '" + fullPath + "'");
      }

      n.path = path.slice(0, i);

      // First node: catchAll node with empty path
      const catchAllChild = n.addChild(
        new RouteTreeNode("", "", true, SegmentType.CatchAll, 1, [], null)
      );
      n.indices = "/";
      n = catchAllChild;

      // Second node: node holding the variable
      n.addChild(new RouteTreeNode(path.slice(i), "", false, SegmentType.CatchAll, 1, [], value));
      return;
    }
    // If no wildcard was found, insert the path and handle
    n.path = path;
    n.value = value;
  }

  // Increments priority of the given child and reorders if necessary
  private incrementChildPriority(pos: number) {
    const cs = this.children;
    cs[pos].priority++;
    const prio = cs[pos].priority;

    // Adjust position (move to front)
    let newPos = pos;
    for (; newPos > 0 && cs[newPos - 1].priority < prio; newPos--) {
      // Swap node positions
      [cs[newPos - 1], cs[newPos]] = [cs[newPos], cs[newPos - 1]];
    }

    // Build new index char string
    if (newPos !== pos) {
      this.indices =
        this.indices.slice(0, newPos) +
        this.indices[pos] +
        this.indices.slice(newPos, pos) +
        this.indices.slice(pos + 1);
    }
    return newPos;
  }
}

function findWildcard(path: string) {
  // Find start
  for (let i = 0; i < path.length; i++) {
    const c = path.charCodeAt(i);
    // A wildcard starts with ':' (param) or '*' (catch-all)
    if (c !== CharCode.Colon && c !== CharCode.Star) {
      continue;
    }
    // Find end and check for invalid characters
    let valid = true;
    const rest = path.slice(i + 1);
    for (let end = 0; end < rest.length; end++) {
      const c = rest.charCodeAt(end);
      if (c === CharCode.Slash) return { wildcard: path.slice(i, i + 1 + end), i, valid };
      if (c === CharCode.Colon || c === CharCode.Star) valid = false;
    }
    return { wildcard: path.slice(i), i, valid };
  }
  return { wildcard: "", i: -1, valid: false };
}

function longestCommonPrefix(a: string, b: string) {
  let i = 0;
  const max = Math.min(a.length, b.length);
  while (i < max && a[i] === b[i]) i++;
  return i;
}
