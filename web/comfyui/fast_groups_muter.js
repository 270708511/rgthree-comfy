import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";
import { RgthreeBaseVirtualNode } from "./base_node.js";
import { NodeTypesString } from "./constants.js";
import { SERVICE as FAST_GROUPS_SERVICE } from "./services/fast_groups_service.js";
import { drawNodeWidget, fitString } from "./utils_canvas.js";
import { RgthreeBaseWidget } from "./utils_widgets.js";
import { changeModeOfNodes, getGroupNodes } from "./utils.js";
const PROPERTY_SORT = "sort";
const PROPERTY_SORT_CUSTOM_ALPHA = "customSortAlphabet";
const PROPERTY_MATCH_COLORS = "matchColors";
const PROPERTY_MATCH_TITLE = "matchTitle";
const PROPERTY_SHOW_NAV = "showNav";
const PROPERTY_SHOW_ALL_GRAPHS = "showAllGraphs";
const PROPERTY_RESTRICTION = "toggleRestriction";
function readPanelValue(value) {
    if (value && typeof value === "object") {
        const record = value;
        if ("value" in record) {
            return record.value;
        }
        if ("content" in record) {
            return record.content;
        }
    }
    return value;
}
function readStringPanelValue(value, fallback = "") {
    const raw = readPanelValue(value);
    if (raw == null) {
        return fallback;
    }
    return String(raw);
}
function readBooleanPanelValue(value) {
    const raw = readPanelValue(value);
    if (typeof raw === "boolean") {
        return raw;
    }
    if (typeof raw === "number") {
        return raw !== 0;
    }
    if (typeof raw === "string") {
        const normalized = raw.trim().toLowerCase();
        if (["true", "1", "yes", "on", "开", "是"].includes(normalized)) {
            return true;
        }
        if (["false", "0", "no", "off", "关", "否"].includes(normalized)) {
            return false;
        }
    }
    return !!raw;
}
function getGroupKey(group) {
    var _a, _b;
    if ((group === null || group === void 0 ? void 0 : group.id) != null) {
        return `${((_a = group.graph) === null || _a === void 0 ? void 0 : _a.id) || "graph"}:${group.id}`;
    }
    const pos = group._pos || group.pos || [0, 0];
    const size = group._size || group.size || [0, 0];
    return [
        ((_b = group.graph) === null || _b === void 0 ? void 0 : _b.id) || "graph",
        group.title || "",
        group.color || "",
        Math.round(pos[0] || 0),
        Math.round(pos[1] || 0),
        Math.round(size[0] || 0),
        Math.round(size[1] || 0),
    ].join("|");
}
export class BaseFastGroupsModeChanger extends RgthreeBaseVirtualNode {
    constructor(title = FastGroupsMuter.title) {
        super(title);
        this.modeOn = LiteGraph.ALWAYS;
        this.modeOff = LiteGraph.NEVER;
        this.debouncerTempWidth = 0;
        this.propertiesProxyInstalled = false;
        this.propertiesTarget = {};
        this.vueRefreshBaseSize = null;
        this.vueRefreshToken = 0;
        this.tempSize = null;
        this.serialize_widgets = false;
        this.helpActions = "mute and unmute";
        this.properties[PROPERTY_MATCH_COLORS] = "";
        this.properties[PROPERTY_MATCH_TITLE] = "";
        this.properties[PROPERTY_SHOW_NAV] = true;
        this.properties[PROPERTY_SHOW_ALL_GRAPHS] = true;
        this.properties[PROPERTY_SORT] = "position";
        this.properties[PROPERTY_SORT_CUSTOM_ALPHA] = "";
        this.properties[PROPERTY_RESTRICTION] = "default";
        this.installPropertiesProxy();
        this.normalizeProperties();
    }
    onConstructed() {
        this.addOutput("OPT_CONNECTION", "*");
        return super.onConstructed();
    }
    onAdded(graph) {
        FAST_GROUPS_SERVICE.addFastGroupNode(this);
        this.tempSize = [...this.size];
    }
    onRemoved() {
        FAST_GROUPS_SERVICE.removeFastGroupNode(this);
    }
    configure(info) {
        super.configure(info);
        this.installPropertiesProxy();
        this.normalizeProperties();
        this.refreshWidgets();
    }
    normalizeProperties() {
        var _a, _b, _c, _d, _e, _f, _g;
        this.properties[PROPERTY_MATCH_COLORS] = readStringPanelValue((_a = this.properties) === null || _a === void 0 ? void 0 : _a[PROPERTY_MATCH_COLORS], "");
        this.properties[PROPERTY_MATCH_TITLE] = readStringPanelValue((_b = this.properties) === null || _b === void 0 ? void 0 : _b[PROPERTY_MATCH_TITLE], "");
        this.properties[PROPERTY_SHOW_NAV] = readBooleanPanelValue((_c = this.properties) === null || _c === void 0 ? void 0 : _c[PROPERTY_SHOW_NAV]);
        this.properties[PROPERTY_SHOW_ALL_GRAPHS] = readBooleanPanelValue((_d = this.properties) === null || _d === void 0 ? void 0 : _d[PROPERTY_SHOW_ALL_GRAPHS]);
        this.properties[PROPERTY_SORT] = readStringPanelValue((_e = this.properties) === null || _e === void 0 ? void 0 : _e[PROPERTY_SORT], "position");
        this.properties[PROPERTY_SORT_CUSTOM_ALPHA] = readStringPanelValue((_f = this.properties) === null || _f === void 0 ? void 0 : _f[PROPERTY_SORT_CUSTOM_ALPHA], "");
        this.properties[PROPERTY_RESTRICTION] = readStringPanelValue((_g = this.properties) === null || _g === void 0 ? void 0 : _g[PROPERTY_RESTRICTION], "default");
    }
    installPropertiesProxy() {
        if (this.propertiesProxyInstalled) {
            return;
        }
        const refreshProperties = new Set([
            PROPERTY_MATCH_COLORS,
            PROPERTY_MATCH_TITLE,
            PROPERTY_SHOW_NAV,
            PROPERTY_SHOW_ALL_GRAPHS,
            PROPERTY_SORT,
            PROPERTY_SORT_CUSTOM_ALPHA,
            PROPERTY_RESTRICTION,
        ]);
        const wrapProperties = (properties) => new Proxy(properties || {}, {
            set: (target, property, value) => {
                const prevValue = target[property];
                const result = Reflect.set(target, property, value);
                if (result &&
                    prevValue !== value &&
                    typeof property === "string" &&
                    refreshProperties.has(property)) {
                    queueMicrotask(() => {
                        this.refreshWidgets();
                        this.setDirtyCanvas(true, true);
                    });
                }
                return result;
            },
        });
        this.propertiesTarget = wrapProperties(this.properties || {});
        Object.defineProperty(this, "properties", {
            configurable: true,
            enumerable: true,
            get: () => this.propertiesTarget,
            set: (value) => {
                this.propertiesTarget = wrapProperties(value || {});
                queueMicrotask(() => {
                    this.refreshWidgets();
                    this.setDirtyCanvas(true, true);
                });
            },
        });
        this.propertiesProxyInstalled = true;
    }
    onPropertyChanged(property, value, prevValue) {
        if ([
            PROPERTY_MATCH_COLORS,
            PROPERTY_MATCH_TITLE,
            PROPERTY_SHOW_NAV,
            PROPERTY_SHOW_ALL_GRAPHS,
            PROPERTY_SORT,
            PROPERTY_SORT_CUSTOM_ALPHA,
            PROPERTY_RESTRICTION,
        ].includes(property)) {
            this.refreshWidgets();
            this.setDirtyCanvas(true, true);
        }
        return true;
    }
    refreshVueNodeState() {
        const baseSize = this.vueRefreshBaseSize || [...this.size];
        this.vueRefreshBaseSize = baseSize;
        const refreshToken = ++this.vueRefreshToken;
        this.widgets = [...(this.widgets || [])];
        const canvas = app.canvas;
        requestAnimationFrame(() => {
            if (refreshToken !== this.vueRefreshToken) {
                return;
            }
            this.setSize([baseSize[0] + 0.5, baseSize[1]]);
            canvas === null || canvas === void 0 ? void 0 : canvas.setDirty(true, true);
            requestAnimationFrame(() => {
                var _a, _b;
                if (refreshToken !== this.vueRefreshToken) {
                    return;
                }
                this.setSize([...baseSize]);
                this.vueRefreshBaseSize = null;
                (_a = canvas === null || canvas === void 0 ? void 0 : canvas.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(canvas);
                canvas === null || canvas === void 0 ? void 0 : canvas.setDirty(true, true);
                (_b = canvas === null || canvas === void 0 ? void 0 : canvas.draw) === null || _b === void 0 ? void 0 : _b.call(canvas, true, true);
            });
        });
        queueMicrotask(() => {
            const graph = app.graph;
            if (!graph) {
                return;
            }
            const workflow = graph.serialize();
            api.dispatchEvent(new CustomEvent("graphChanged", { detail: workflow }));
            api.dispatchEvent(new CustomEvent("change_workflow", { detail: workflow }));
        });
    }
    onAddPropertyToPanel(pName, panel) {
        const panelProperties = new Set([
            PROPERTY_MATCH_COLORS,
            PROPERTY_MATCH_TITLE,
            PROPERTY_SHOW_NAV,
            PROPERTY_SHOW_ALL_GRAPHS,
            PROPERTY_SORT,
            PROPERTY_SORT_CUSTOM_ALPHA,
            PROPERTY_RESTRICTION,
        ]);
        if (!panelProperties.has(pName)) {
            return false;
        }
        const labels = {
            [PROPERTY_MATCH_COLORS]: "颜色匹配",
            [PROPERTY_MATCH_TITLE]: "标题匹配",
            [PROPERTY_SHOW_NAV]: "显示导航",
            [PROPERTY_SHOW_ALL_GRAPHS]: "显示所有图表",
            [PROPERTY_SORT]: "排序",
            [PROPERTY_SORT_CUSTOM_ALPHA]: "自定义字母顺序",
            [PROPERTY_RESTRICTION]: "切换限制",
        };
        const comboValues = {
            [PROPERTY_MATCH_COLORS]: [
                "",
                "black",
                "blue",
                "brown",
                "cyan",
                "green",
                "pale_blue",
                "pink",
                "purple",
                "red",
                "yellow",
            ],
            [PROPERTY_SORT]: ["position", "alphanumeric", "custom alphabet"],
            [PROPERTY_RESTRICTION]: ["default", "max one", "always one"],
        };
        const isBoolean = pName === PROPERTY_SHOW_NAV || pName === PROPERTY_SHOW_ALL_GRAPHS;
        const values = comboValues[pName];
        const type = isBoolean ? "boolean" : values ? "combo" : "string";
        const value = isBoolean
            ? readBooleanPanelValue(this.properties[pName])
            : readStringPanelValue(this.properties[pName]);
        panel.addWidget(type, pName, value, { label: labels[pName], ...(values ? { values } : {}) }, (_name, nextValue) => {
            var _a;
            const normalizedValue = isBoolean
                ? readBooleanPanelValue(nextValue)
                : readStringPanelValue(nextValue);
            const graph = this.graph;
            graph === null || graph === void 0 ? void 0 : graph.beforeChange(this);
            this.setProperty(pName, normalizedValue);
            graph === null || graph === void 0 ? void 0 : graph.afterChange();
            this.refreshWidgets();
            this.refreshVueNodeState();
            this.setDirtyCanvas(true, true);
            (_a = app.canvas) === null || _a === void 0 ? void 0 : _a.setDirty(true, true);
        });
        return true;
    }
    refreshWidgets() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const canvas = app.canvas;
        let sort = ((_a = this.properties) === null || _a === void 0 ? void 0 : _a[PROPERTY_SORT]) || "position";
        let customAlphabet = null;
        if (sort === "custom alphabet") {
            const customAlphaStr = (_c = (_b = this.properties) === null || _b === void 0 ? void 0 : _b[PROPERTY_SORT_CUSTOM_ALPHA]) === null || _c === void 0 ? void 0 : _c.replace(/\n/g, "");
            if (customAlphaStr && customAlphaStr.trim()) {
                customAlphabet = customAlphaStr.includes(",")
                    ? customAlphaStr.toLocaleLowerCase().split(",")
                    : customAlphaStr.toLocaleLowerCase().trim().split("");
            }
            if (!(customAlphabet === null || customAlphabet === void 0 ? void 0 : customAlphabet.length)) {
                sort = "alphanumeric";
                customAlphabet = null;
            }
        }
        const groups = [...FAST_GROUPS_SERVICE.getGroups(sort)];
        if (customAlphabet === null || customAlphabet === void 0 ? void 0 : customAlphabet.length) {
            groups.sort((a, b) => {
                let aIndex = -1;
                let bIndex = -1;
                for (const [index, alpha] of customAlphabet.entries()) {
                    aIndex =
                        aIndex < 0 ? (a.title.toLocaleLowerCase().startsWith(alpha) ? index : -1) : aIndex;
                    bIndex =
                        bIndex < 0 ? (b.title.toLocaleLowerCase().startsWith(alpha) ? index : -1) : bIndex;
                    if (aIndex > -1 && bIndex > -1) {
                        break;
                    }
                }
                if (aIndex > -1 && bIndex > -1) {
                    const ret = aIndex - bIndex;
                    if (ret === 0) {
                        return a.title.localeCompare(b.title);
                    }
                    return ret;
                }
                else if (aIndex > -1) {
                    return -1;
                }
                else if (bIndex > -1) {
                    return 1;
                }
                return a.title.localeCompare(b.title);
            });
        }
        let filterColors = (((_e = (_d = this.properties) === null || _d === void 0 ? void 0 : _d[PROPERTY_MATCH_COLORS]) === null || _e === void 0 ? void 0 : _e.split(",")) || []).filter((c) => c.trim());
        if (filterColors.length) {
            filterColors = filterColors.map((color) => {
                color = color.trim().toLocaleLowerCase();
                if (LGraphCanvas.node_colors[color]) {
                    color = LGraphCanvas.node_colors[color].groupcolor;
                }
                color = color.replace("#", "").toLocaleLowerCase();
                if (color.length === 3) {
                    color = color.replace(/(.)(.)(.)/, "$1$1$2$2$3$3");
                }
                return `#${color}`;
            });
        }
        let index = 0;
        for (const group of groups) {
            if (filterColors.length) {
                let groupColor = (_f = group.color) === null || _f === void 0 ? void 0 : _f.replace("#", "").trim().toLocaleLowerCase();
                if (!groupColor) {
                    continue;
                }
                if (groupColor.length === 3) {
                    groupColor = groupColor.replace(/(.)(.)(.)/, "$1$1$2$2$3$3");
                }
                groupColor = `#${groupColor}`;
                if (!filterColors.includes(groupColor)) {
                    continue;
                }
            }
            if ((_h = (_g = this.properties) === null || _g === void 0 ? void 0 : _g[PROPERTY_MATCH_TITLE]) === null || _h === void 0 ? void 0 : _h.trim()) {
                try {
                    if (!new RegExp(this.properties[PROPERTY_MATCH_TITLE], "i").exec(group.title)) {
                        continue;
                    }
                }
                catch (e) {
                    console.error(e);
                    continue;
                }
            }
            const showAllGraphs = (_j = this.properties) === null || _j === void 0 ? void 0 : _j[PROPERTY_SHOW_ALL_GRAPHS];
            if (!showAllGraphs && group.graph !== app.canvas.getCurrentGraph()) {
                continue;
            }
            let isDirty = false;
            const widgetLabel = `Enable ${group.title}`;
            const groupKey = getGroupKey(group);
            let widget = this.widgets.find((w) => w instanceof FastGroupsToggleRowWidget && w.groupKey === groupKey);
            if (!widget) {
                this.tempSize = [...this.size];
                widget = this.addCustomWidget(new FastGroupsToggleRowWidget(group, this, groupKey));
                this.setSize(this.computeSize());
                isDirty = true;
            }
            widget.group = group;
            if (widget.name != widgetLabel) {
                widget.name = widgetLabel;
                isDirty = true;
            }
            if (widget.label != widgetLabel) {
                widget.label = widgetLabel;
                isDirty = true;
            }
            if (group.rgthree_hasAnyActiveNode != null &&
                widget.toggled != group.rgthree_hasAnyActiveNode) {
                widget.toggled = group.rgthree_hasAnyActiveNode;
                isDirty = true;
            }
            if (this.widgets[index] !== widget) {
                const oldIndex = this.widgets.findIndex((w) => w === widget);
                this.widgets.splice(index, 0, this.widgets.splice(oldIndex, 1)[0]);
                isDirty = true;
            }
            if (isDirty) {
                this.setDirtyCanvas(true, false);
            }
            index++;
        }
        while ((this.widgets || [])[index]) {
            this.removeWidget(index++);
        }
    }
    computeSize(out) {
        let size = super.computeSize(out);
        if (this.tempSize) {
            size[0] = Math.max(this.tempSize[0], size[0]);
            size[1] = Math.max(this.tempSize[1], size[1]);
            this.debouncerTempWidth && clearTimeout(this.debouncerTempWidth);
            this.debouncerTempWidth = setTimeout(() => {
                this.tempSize = null;
            }, 32);
        }
        setTimeout(() => {
            var _a;
            (_a = this.graph) === null || _a === void 0 ? void 0 : _a.setDirtyCanvas(true, true);
        }, 16);
        return size;
    }
    async handleAction(action) {
        var _a, _b, _c, _d, _e;
        if (action === "Mute all" || action === "Bypass all") {
            const alwaysOne = ((_a = this.properties) === null || _a === void 0 ? void 0 : _a[PROPERTY_RESTRICTION]) === "always one";
            for (const [index, widget] of this.widgets.entries()) {
                widget === null || widget === void 0 ? void 0 : widget.doModeChange(alwaysOne && !index ? true : false, true);
            }
        }
        else if (action === "Enable all") {
            const onlyOne = (_b = this.properties) === null || _b === void 0 ? void 0 : _b[PROPERTY_RESTRICTION].includes(" one");
            for (const [index, widget] of this.widgets.entries()) {
                widget === null || widget === void 0 ? void 0 : widget.doModeChange(onlyOne && index > 0 ? false : true, true);
            }
        }
        else if (action === "Toggle all") {
            const onlyOne = (_c = this.properties) === null || _c === void 0 ? void 0 : _c[PROPERTY_RESTRICTION].includes(" one");
            let foundOne = false;
            for (const [index, widget] of this.widgets.entries()) {
                let newValue = onlyOne && foundOne ? false : !widget.value;
                foundOne = foundOne || newValue;
                widget === null || widget === void 0 ? void 0 : widget.doModeChange(newValue, true);
            }
            if (!foundOne && ((_d = this.properties) === null || _d === void 0 ? void 0 : _d[PROPERTY_RESTRICTION]) === "always one") {
                (_e = this.widgets[this.widgets.length - 1]) === null || _e === void 0 ? void 0 : _e.doModeChange(true, true);
            }
        }
    }
    getHelp() {
        return `
      <p>The ${this.type.replace("(rgthree)", "")} is an input-less node that automatically collects all groups in your current
      workflow and allows you to quickly ${this.helpActions} all nodes within the group.</p>
      <ul>
        <li>
          <p>
            <strong>Properties.</strong> You can change the following properties (by right-clicking
            on the node, and select "Properties" or "Properties Panel" from the menu):
          </p>
          <ul>
            <li><p>
              <code>${PROPERTY_MATCH_COLORS}</code> - Only add groups that match the provided
              colors. Can be ComfyUI colors (red, pale_blue) or hex codes (#a4d399). Multiple can be
              added, comma delimited.
            </p></li>
            <li><p>
              <code>${PROPERTY_MATCH_TITLE}</code> - Filter the list of toggles by title match
              (string match, or regular expression).
            </p></li>
            <li><p>
              <code>${PROPERTY_SHOW_NAV}</code> - Add / remove a quick navigation arrow to take you
              to the group. <i>(default: true)</i>
            </p></li>
            <li><p>
              <code>${PROPERTY_SHOW_ALL_GRAPHS}</code> - Show groups from all [sub]graphs in the
              workflow. <i>(default: true)</i>
            </p></li>
            <li><p>
              <code>${PROPERTY_SORT}</code> - Sort the toggles' order by "alphanumeric", graph
              "position", or "custom alphabet". <i>(default: "position")</i>
            </p></li>
            <li>
              <p>
                <code>${PROPERTY_SORT_CUSTOM_ALPHA}</code> - When the
                <code>${PROPERTY_SORT}</code> property is "custom alphabet" you can define the
                alphabet to use here, which will match the <i>beginning</i> of each group name and
                sort against it. If group titles do not match any custom alphabet entry, then they
                will be put after groups that do, ordered alphanumerically.
              </p>
              <p>
                This can be a list of single characters, like "zyxw..." or comma delimited strings
                for more control, like "sdxl,pro,sd,n,p".
              </p>
              <p>
                Note, when two group title match the same custom alphabet entry, the <i>normal
                alphanumeric alphabet</i> breaks the tie. For instance, a custom alphabet of
                "e,s,d" will order groups names like "SDXL, SEGS, Detailer" eventhough the custom
                alphabet has an "e" before "d" (where one may expect "SE" to be before "SD").
              </p>
              <p>
                To have "SEGS" appear before "SDXL" you can use longer strings. For instance, the
                custom alphabet value of "se,s,f" would work here.
              </p>
            </li>
            <li><p>
              <code>${PROPERTY_RESTRICTION}</code> - Optionally, attempt to restrict the number of
              widgets that can be enabled to a maximum of one, or always one.
              </p>
              <p><em><strong>Note:</strong> If using "max one" or "always one" then this is only
              enforced when clicking a toggle on this node; if nodes within groups are changed
              outside of the initial toggle click, then these restriction will not be enforced, and
              could result in a state where more than one toggle is enabled. This could also happen
              if nodes are overlapped with multiple groups.
            </p></li>

          </ul>
        </li>
      </ul>`;
    }
}
BaseFastGroupsModeChanger.type = NodeTypesString.FAST_GROUPS_MUTER;
BaseFastGroupsModeChanger.title = NodeTypesString.FAST_GROUPS_MUTER;
BaseFastGroupsModeChanger.exposedActions = ["Mute all", "Enable all", "Toggle all"];
BaseFastGroupsModeChanger["@matchColors"] = { type: "string" };
BaseFastGroupsModeChanger["@matchTitle"] = { type: "string" };
BaseFastGroupsModeChanger["@showNav"] = { type: "boolean" };
BaseFastGroupsModeChanger["@showAllGraphs"] = { type: "boolean" };
BaseFastGroupsModeChanger["@sort"] = {
    type: "combo",
    values: ["position", "alphanumeric", "custom alphabet"],
};
BaseFastGroupsModeChanger["@customSortAlphabet"] = { type: "string" };
BaseFastGroupsModeChanger["@toggleRestriction"] = {
    type: "combo",
    values: ["default", "max one", "always one"],
};
export class FastGroupsMuter extends BaseFastGroupsModeChanger {
    constructor(title = FastGroupsMuter.title) {
        super(title);
        this.comfyClass = NodeTypesString.FAST_GROUPS_MUTER;
        this.helpActions = "mute and unmute";
        this.modeOn = LiteGraph.ALWAYS;
        this.modeOff = LiteGraph.NEVER;
        this.onConstructed();
    }
}
FastGroupsMuter.type = NodeTypesString.FAST_GROUPS_MUTER;
FastGroupsMuter.title = NodeTypesString.FAST_GROUPS_MUTER;
FastGroupsMuter.exposedActions = ["Bypass all", "Enable all", "Toggle all"];
class FastGroupsToggleRowWidget extends RgthreeBaseWidget {
    constructor(group, node, groupKey) {
        super(`Enable ${group.title}`);
        this.value = { toggled: false };
        this.options = { on: "yes", off: "no" };
        this.type = "custom";
        this.label = "";
        this.layoutRefreshToken = 0;
        this.group = group;
        this.node = node;
        this.groupKey = groupKey;
    }
    refreshVueNodeLayout() {
        const originalSize = [...this.node.size];
        const pulseSize = [originalSize[0] + 0.5, originalSize[1]];
        requestAnimationFrame(() => {
            var _a, _b;
            this.node.setSize(pulseSize);
            (_b = (_a = this.node).onResize) === null || _b === void 0 ? void 0 : _b.call(_a, pulseSize);
            requestAnimationFrame(() => {
                var _a, _b, _c, _d;
                this.node.setSize(originalSize);
                (_b = (_a = this.node).onResize) === null || _b === void 0 ? void 0 : _b.call(_a, originalSize);
                this.node.setDirtyCanvas(true, true);
                (_c = this.group.graph) === null || _c === void 0 ? void 0 : _c.setDirtyCanvas(true, true);
                (_d = app.canvas) === null || _d === void 0 ? void 0 : _d.setDirty(true, true);
            });
        });
    }
    doModeChange(force, skipOtherNodeCheck) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        const liveGroup = ((_b = (_a = this.group.graph) === null || _a === void 0 ? void 0 : _a._groups) === null || _b === void 0 ? void 0 : _b.find((g) => getGroupKey(g) === this.groupKey)) || this.group;
        this.group = liveGroup;
        this.group.recomputeInsideNodes();
        const hasAnyActiveNodes = getGroupNodes(this.group).some((n) => n.mode === LiteGraph.ALWAYS);
        let newValue = force != null ? force : !hasAnyActiveNodes;
        if (skipOtherNodeCheck !== true) {
            if (newValue && ((_d = (_c = this.node.properties) === null || _c === void 0 ? void 0 : _c[PROPERTY_RESTRICTION]) === null || _d === void 0 ? void 0 : _d.includes(" one"))) {
                for (const widget of this.node.widgets) {
                    if (widget instanceof FastGroupsToggleRowWidget) {
                        widget.doModeChange(false, true);
                    }
                }
            }
            else if (!newValue && ((_e = this.node.properties) === null || _e === void 0 ? void 0 : _e[PROPERTY_RESTRICTION]) === "always one") {
                newValue = this.node.widgets.every((w) => !w.value || w === this);
            }
        }
        changeModeOfNodes(getGroupNodes(this.group), (newValue ? this.node.modeOn : this.node.modeOff));
        this.group.rgthree_hasAnyActiveNode = newValue;
        this.toggled = newValue;
        (_g = (_f = this.node).onWidgetChanged) === null || _g === void 0 ? void 0 : _g.call(_f, this.label, newValue, !newValue, this);
        this.node.widgets = [...this.node.widgets];
        this.node.refreshWidgets();
        this.refreshVueNodeLayout();
        this.node.setDirtyCanvas(true, true);
        (_h = this.group.graph) === null || _h === void 0 ? void 0 : _h.setDirtyCanvas(true, true);
        (_j = app.canvas) === null || _j === void 0 ? void 0 : _j.setDirty(true, true);
        const canvas = app.canvas;
        const redrawCanvas = (targetCanvas) => {
            var _a;
            targetCanvas === null || targetCanvas === void 0 ? void 0 : targetCanvas.setDirty(true, true);
            (_a = targetCanvas === null || targetCanvas === void 0 ? void 0 : targetCanvas.draw) === null || _a === void 0 ? void 0 : _a.call(targetCanvas, true, true);
        };
        redrawCanvas(canvas);
        if ((_k = canvas === null || canvas === void 0 ? void 0 : canvas.selected_nodes) === null || _k === void 0 ? void 0 : _k[this.node.id]) {
            canvas.deselectAll();
            (_l = canvas.onSelectionChange) === null || _l === void 0 ? void 0 : _l.call(canvas);
            requestAnimationFrame(() => {
                var _a;
                const currentCanvas = app.canvas;
                currentCanvas.selectNode(this.node, false);
                (_a = currentCanvas.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(currentCanvas);
                redrawCanvas(currentCanvas);
            });
        }
        else {
            queueMicrotask(() => {
                var _a;
                (_a = canvas === null || canvas === void 0 ? void 0 : canvas.onSelectionChange) === null || _a === void 0 ? void 0 : _a.call(canvas);
                redrawCanvas(canvas);
            });
        }
        queueMicrotask(() => {
            const graph = app.graph;
            if (graph) {
                const workflow = graph.serialize();
                api.dispatchEvent(new CustomEvent("graphChanged", { detail: workflow }));
                api.dispatchEvent(new CustomEvent("change_workflow", { detail: workflow }));
            }
        });
    }
    get toggled() {
        return this.value.toggled;
    }
    set toggled(value) {
        this.value.toggled = value;
    }
    toggle(value) {
        value = value == null ? !this.toggled : value;
        if (value !== this.toggled) {
            this.value.toggled = value;
            this.doModeChange();
        }
    }
    draw(ctx, node, width, posY, height) {
        var _a;
        const widgetData = drawNodeWidget(ctx, { size: [width, height], pos: [15, posY] });
        const showNav = ((_a = node.properties) === null || _a === void 0 ? void 0 : _a[PROPERTY_SHOW_NAV]) !== false;
        let currentX = widgetData.width - widgetData.margin;
        if (!widgetData.lowQuality && showNav) {
            currentX -= 7;
            const midY = widgetData.posY + widgetData.height * 0.5;
            ctx.fillStyle = ctx.strokeStyle = "#89A";
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            const arrow = new Path2D(`M${currentX} ${midY} l -7 6 v -3 h -7 v -6 h 7 v -3 z`);
            ctx.fill(arrow);
            ctx.stroke(arrow);
            currentX -= 14;
            currentX -= 7;
            ctx.strokeStyle = widgetData.colorOutline;
            ctx.stroke(new Path2D(`M ${currentX} ${widgetData.posY} v ${widgetData.height}`));
        }
        else if (widgetData.lowQuality && showNav) {
            currentX -= 28;
        }
        currentX -= 7;
        ctx.fillStyle = this.toggled ? "#89A" : "#333";
        ctx.beginPath();
        const toggleRadius = height * 0.36;
        ctx.arc(currentX - toggleRadius, posY + height * 0.5, toggleRadius, 0, Math.PI * 2);
        ctx.fill();
        currentX -= toggleRadius * 2;
        if (!widgetData.lowQuality) {
            currentX -= 4;
            ctx.textAlign = "right";
            ctx.fillStyle = this.toggled ? widgetData.colorText : widgetData.colorTextSecondary;
            const label = this.label;
            const toggleLabelOn = this.options.on || "true";
            const toggleLabelOff = this.options.off || "false";
            ctx.fillText(this.toggled ? toggleLabelOn : toggleLabelOff, currentX, posY + height * 0.7);
            currentX -= Math.max(ctx.measureText(toggleLabelOn).width, ctx.measureText(toggleLabelOff).width);
            currentX -= 7;
            ctx.textAlign = "left";
            let maxLabelWidth = widgetData.width - widgetData.margin - 10 - (widgetData.width - currentX);
            if (label != null) {
                ctx.fillText(fitString(ctx, label, maxLabelWidth), widgetData.margin + 10, posY + height * 0.7);
            }
        }
    }
    serializeValue(node, index) {
        return this.value;
    }
    mouse(event, pos, node) {
        var _a, _b, _c;
        if (event.type == "pointerdown") {
            if (((_a = node.properties) === null || _a === void 0 ? void 0 : _a[PROPERTY_SHOW_NAV]) !== false && pos[0] >= node.size[0] - 15 - 28 - 1) {
                const canvas = app.canvas;
                const lowQuality = (((_b = canvas.ds) === null || _b === void 0 ? void 0 : _b.scale) || 1) <= 0.5;
                if (!lowQuality) {
                    canvas.centerOnNode(this.group);
                    const zoomCurrent = ((_c = canvas.ds) === null || _c === void 0 ? void 0 : _c.scale) || 1;
                    const zoomX = canvas.canvas.width / this.group._size[0] - 0.02;
                    const zoomY = canvas.canvas.height / this.group._size[1] - 0.02;
                    canvas.setZoom(Math.min(zoomCurrent, zoomX, zoomY), [
                        canvas.canvas.width / 2,
                        canvas.canvas.height / 2,
                    ]);
                    canvas.setDirty(true, true);
                }
            }
            else {
                this.toggle();
            }
        }
        return true;
    }
}
app.registerExtension({
    name: "rgthree.FastGroupsMuter",
    registerCustomNodes() {
        FastGroupsMuter.setUp();
    },
    loadedGraphNode(node) {
        if (node.type == FastGroupsMuter.title) {
            node.tempSize = [...node.size];
        }
    },
});
