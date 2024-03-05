import 'igniteui-webcomponents/themes/light/bootstrap.css'

import '@webcomponents/custom-elements/custom-elements.min';
import '@webcomponents/custom-elements/src/native-shim.js';

import {
    IgcLegendModule,
    IgcDataChartCoreModule,
    IgcDataChartCategoryModule,
    IgcDataChartCategoryCoreModule,
    IgcDataChartInteractivityModule,
    IgcDataChartAnnotationModule,
    IgcDataChartVerticalCategoryModule,
    IgcAnnotationLayerProxyModule,
    IgcDataChartToolbarModule,
    IgcDataChartCategoryTrendLineModule,
    IgcCrosshairLayerComponent,
    MarkerType,
    IgcCalloutLayerComponent,
    IgcCalloutLabelUpdatingEventArgs,
    IgcPlotAreaMouseEventArgs,
    IgcChartMouseEventArgs,
} from '@infragistics/igniteui-webcomponents-charts';
import { IgcToolbarModule, IgcToolActionLabelModule } from '@infragistics/igniteui-webcomponents-layouts';
import {
    IgcColumnSeriesComponent,
    IgcLegendComponent,
    IgcDataChartComponent,
    IgcCategoryXAxisComponent,
    IgcNumericYAxisComponent,
    IgcDataToolTipLayerComponent,
    IgcSeriesViewerComponent,
    IgcCategorySeriesComponent,
} from '@infragistics/igniteui-webcomponents-charts';
import { IgcToolbarComponent,IgcToolActionIconMenuComponent,IgcToolActionCheckboxComponent,IgcToolActionLabelComponent } from '@infragistics/igniteui-webcomponents-layouts';
import {
    IgcAssigningCategoryStyleEventArgs,
    IgcDataChartMouseButtonEventArgs,
} from '@infragistics/igniteui-webcomponents-charts';
import { IgcToolCommandEventArgs } from '@infragistics/igniteui-webcomponents-layouts';
import { IgcValueOverlayModule } from '@infragistics/igniteui-webcomponents-charts';
import { DataTemplateRenderInfo, DataTemplateMeasureInfo, ModuleManager } from '@infragistics/igniteui-webcomponents-core';
import { themeSymbol } from 'igniteui-webcomponents/theming/theming-controller';

ModuleManager.register(
    IgcLegendModule,
    IgcDataChartCoreModule,
    IgcDataChartCategoryModule,
    IgcDataChartCategoryCoreModule,
    IgcDataChartInteractivityModule,
    IgcDataChartCategoryTrendLineModule,
    IgcDataChartVerticalCategoryModule,
    IgcValueOverlayModule,
    IgcDataChartAnnotationModule,
    IgcAnnotationLayerProxyModule,
    IgcToolbarModule,
    IgcDataChartToolbarModule,
    IgcToolActionLabelModule,
);

declare global {
    interface Window {
        revealBridge: any;
        revealBridgeListener: any;
    }
}

interface Node {
    id: string;
    name: string;
    children?: Node[]; // 再帰的な型定義で子ノードを持つ
}

export class SKNextColumnChart {

    private chartData: any[] | undefined;
    private legend: IgcLegendComponent
    private toolbar: IgcToolbarComponent
    private chart: IgcDataChartComponent
    private xAxis: IgcCategoryXAxisComponent
    private yAxis: IgcNumericYAxisComponent
    private columnSeries: IgcColumnSeriesComponent
    private crosshairLayer: IgcCrosshairLayerComponent
    private calloutLayer: IgcCalloutLayerComponent
    private _bind: () => void;
    private tabularData: { [key: string]: any; }[] | undefined;
    private category: string = "";
    private enableSelecting: boolean = false;
    private canDrillDown: boolean = false;
    private dataNodeLayer!: Node;
    private currentDataNodeLayer: string = "Date";

    private drillUp: HTMLElement;
    private drillDown: HTMLElement;

    constructor() {
        this.onAssigningCategoryStyle = this.onAssigningCategoryStyle.bind(this);
        this.onCalloutLabelUpdating = this.onCalloutLabelUpdating.bind(this);

        var legend = this.legend = document.getElementById('Legend') as unknown as IgcLegendComponent;
        var toolbar = this.toolbar = document.getElementById('Toolbar') as IgcToolbarComponent;
        this.toolbarToggleAction = this.toolbarToggleAction.bind(this);
        var chart = this.chart = document.getElementById('Chart') as unknown as IgcDataChartComponent;
        var yAxis = this.yAxis = document.getElementById('yAxis') as unknown as IgcNumericYAxisComponent;
        var xAxis = this.xAxis = document.getElementById('xAxis') as unknown as IgcCategoryXAxisComponent;
        var crosshairLayer = this.crosshairLayer = document.getElementById('crosshairLayer') as IgcCrosshairLayerComponent;
        var columnSeries = this.columnSeries = document.getElementById('ColumnSeries') as unknown as IgcColumnSeriesComponent;
        var calloutLayer = this.calloutLayer = document.getElementById('CalloutLayer') as unknown as IgcCalloutLayerComponent;
        var chartContainer = document.getElementById('ChartContainer') as HTMLDivElement;
        var drillUp = this.drillUp = document.getElementById('drill-up') as HTMLElement;
        var drillDown = this.drillDown = document.getElementById('drill-down') as HTMLElement;
        this.chart.highlightedValuesDisplayMode = 1;
        this._bind = () => {
            toolbar.target = this.chart;
            toolbar.onCommand = this.toolbarToggleAction;
            chart.legend = this.legend;
            xAxis.tickLength = 0;
            xAxis.labelTextStyle = "12px Roboto";
            yAxis.majorStrokeThickness = 0;
            yAxis.labelTextStyle = "12px Roboto";
            yAxis.formatLabel = function (num) {
                return num.toLocaleString();
            };
            columnSeries.xAxis = this.xAxis;
            columnSeries.yAxis = this.yAxis;
            columnSeries.isCustomCategoryStyleAllowed = true;
            columnSeries.assigningCategoryStyle = this.onAssigningCategoryStyle;
            calloutLayer.calloutLabelUpdating = this.onCalloutLabelUpdating;
            calloutLayer.textStyle = "500 12px 'Roboto'";
            chart.seriesMouseLeftButtonUp = this.onSeriesMouseLeftButtonUp;
            //chart.plotAreaMouseOver = this.onPlotAreaMouseOver;
            chart.onmousemove = this.onMouseEnter;
            chartContainer.onmouseleave = this.onMouseLeave;
            crosshairLayer.cursorPosition = { x: 0, y: 0 };
            xAxis.formatLabel = this.formatDateString;
            drillUp.onclick = this.onDrillUpClick;
            drillDown.onclick = this.onDrillDownClick;
        }
        this._bind();
        this.toolbarCustomIconOnViewInit();

        window.revealBridgeListener = {
            dataReady: (incomingData: any) => {
                console.log(incomingData);
                const columns = incomingData.metadata.columns;
                this.category = columns[0].name;
                this.columnSeries.title = this.getLastWordFromString(columns[columns.length - 1].name);
                this.tabularData = this.combineColumnAndData(columns, incomingData.data);
                this.chartData = this.aggregateDataByCategory(this.tabularData, this.category, columns[columns.length - 1].name);
                this.columnSeries.dataSource = this.chartData;
                this.yAxis.maximumValue = this.increaseFirstDigit(this.findMaxValue(this.chartData));
                this.xAxis.dataSource = this.chartData;
                // console.log(this.tabularData);
            }
        };
        window.revealBridge.notifyExtensionIsReady();

    }

    private onCalloutLabelUpdating(sender:IgcCalloutLayerComponent, e:IgcCalloutLabelUpdatingEventArgs)
    {
        if (e.item != null)
        {
            let value = parseFloat(e.item.value);
            if (!isNaN(value)) {
                e.label = value.toLocaleString(); // Format the number with commas
            }
        }
    }

    public onAssigningCategoryStyle = (
        sender: IgcCategorySeriesComponent,
        evt: IgcAssigningCategoryStyleEventArgs) => {
        let items = evt.getItems(evt.startIndex, evt.endIndex);
        for (let i = 0; i < items.length; i++) {
            if (!this.enableSelecting) {
                items[i].isSelected = false;
            } else {
                if (items[i].isSelected) {
                    evt.strokeThickness = 5;
                    evt.fill = "#3a6b8e";
                }
            }
        }
    }

    // public onPlotAreaMouseOver = (
    //     sender: IgcSeriesViewerComponent,
    //     evt:  IgcPlotAreaMouseEventArgs
    // ) => {
    //     if (evt) {
    //         console.log(evt);
    //     }
    // }

    public onDrillUpClick = () => {
        //console.log('Drill Up');
        //console.log(this.dataNodeLayer, this.currentDataNodeLayer);
        const parentNode = this.findParentNode(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
        //console.log(parentNode);
        if (parentNode !== null) {
            this.currentDataNodeLayer = parentNode?.name;
            if (this.tabularData) {
                this.chartData = this.aggregateDataByCategory(this.tabularData, this.currentDataNodeLayer, "Sum of Sales");
                this.columnSeries.dataSource = this.chartData;
                this.yAxis.maximumValue = this.increaseFirstDigit(this.findMaxValue(this.chartData));
                this.xAxis.dataSource = this.chartData;
            }
        }
        this.columnSeries.notifyVisualPropertiesChanged();
        const currentNode = this.findNodeByName(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
        if (this.isTopLevel(currentNode, this.dataNodeLayer)) {
            this.drillUp.style.display = "none";
            this.drillDown.style.display = "flex";
        } else if(this.isBottomLevel(currentNode)) {
            this.drillUp.style.display = "flex";
            this.drillDown.style.display = "none";
        } else {
            this.drillUp.style.display = "flex";
            this.drillDown.style.display = "flex";
        }
    }

    public onDrillDownClick = () => {
        //console.log('Drill Down');
        //console.log(this.dataNodeLayer, this.currentDataNodeLayer);
        const currentNode = this.findNodeByName(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
        const childNode = currentNode.children?.[0] as Node;
        //console.log(childNode);
        if (childNode !== null) {
            this.currentDataNodeLayer = childNode?.name as string;
            if (this.tabularData) {
                this.chartData = this.aggregateDataByCategory(this.tabularData, this.currentDataNodeLayer, "Sum of Sales");
                // console.log(this.chartData);
                this.columnSeries.dataSource = this.chartData;
                this.yAxis.maximumValue = this.increaseFirstDigit(this.findMaxValue(this.chartData));
                this.xAxis.dataSource = this.chartData;
            }
        }
        this.columnSeries.notifyVisualPropertiesChanged();
        if (this.isTopLevel(childNode, this.dataNodeLayer)) {
            this.drillUp.style.display = "none";
            this.drillDown.style.display = "flex";
        } else if(this.isBottomLevel(childNode)) {
            this.drillUp.style.display = "flex";
            this.drillDown.style.display = "none";
        } else {
            this.drillUp.style.display = "flex";
            this.drillDown.style.display = "flex";
        }
    }

    public onMouseLeave = (
        evt: MouseEvent
    ) => {
        if (evt) {
            const toolTipElement = document.getElementById('CustomTooltip');
            if (toolTipElement) {
                toolTipElement.style.display = 'none';

            }
        }
    }


    public onSeriesMouseLeftButtonUp = (
        sender: IgcSeriesViewerComponent,
        evt: IgcDataChartMouseButtonEventArgs
    ) => {
        if (this.enableSelecting) {
            if (evt.item) {
                evt.item.isSelected = !evt.item.isSelected;
                this.chartData?.forEach((dataItem: any) => {
                    if (dataItem.category === evt.item.category) {
                        dataItem.isSelected = evt.item.isSelected;
                    }
                });
                this.columnSeries.notifyVisualPropertiesChanged();
            }
        }
    }

    public formatDateString(item: any): string {
        // 日付の形式が YYYY-MM-DDThh:mm:ss に一致するかチェック
        const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

        // 条件に一致する場合、T以前の部分だけを返す
        if (regex.test(item.category)) {
            return item.category.split('T')[0];
        }

        // それ以外の場合、元の文字列をそのまま返す
        return item.category;
    }

    // public onClick = (evt:MouseEvent) => {
    //     console.log(evt);
    //     evt.stopPropagation();
    // }

    public onMouseEnter = (evt:MouseEvent) => {
        if (!this.enableSelecting && this.canDrillDown) {
            const toolTipElement = document.getElementById('CustomTooltip');
            const worldPosition = this.columnSeries.toWorldPosition({ x: evt.clientX, y: evt.clientY });
            // console.log(worldPosition);

            const currentNode = this.findNodeByName(this.dataNodeLayer, this.currentDataNodeLayer) as Node;
            // console.log(currentNode);
            if (this.isTopLevel(currentNode, this.dataNodeLayer)) {
                this.drillUp.style.display = "none";
                this.drillDown.style.display = "flex";
            } else if(this.isBottomLevel(currentNode)) {
                this.drillUp.style.display = "flex";
                this.drillDown.style.display = "none";
            } else {
                this.drillUp.style.display = "flex";
                this.drillDown.style.display = "flex";
            }

            if (0 < worldPosition.x && worldPosition.x < 1 && 0 < worldPosition.y && worldPosition.y < 1) {
                if (toolTipElement) {
                    const toolTipTitleElement = document.getElementById('tooltipTitle');
                    //const leftValue = 100 / this.columnSeries.dataSource.length;
                    //const itemIndex = this.columnSeries.getItemIndex({ x: worldPosition.x, y: worldPosition.y});
                    const Item = this.columnSeries.getItem({ x: worldPosition.x, y: worldPosition.y});
                    var x = evt.clientX;
                    if (x + toolTipElement.offsetWidth > window.innerWidth) {
                        x -= toolTipElement.offsetWidth;
                    }
                    toolTipElement.style.left = x + 'px';
                    toolTipElement.style.display = 'block';
                    if (toolTipTitleElement) {
                        if (this.canDrillDown) {
                            const dateObject = new Date(Item.category);
                            if (this.currentDataNodeLayer === "Date") {
                                toolTipTitleElement.innerText = dateObject.getFullYear() + "年" + (dateObject.getMonth() + 1) + "月" + dateObject.getDate() + "日";
                            } else if (this.currentDataNodeLayer === "Month") {
                                toolTipTitleElement.innerText = dateObject.getFullYear() + "年" + (dateObject.getMonth() + 1) + "月";
                            } else if (this.currentDataNodeLayer === "Years") {
                                toolTipTitleElement.innerText = dateObject.getFullYear() + "年";
                            }
                        } else {
                            toolTipTitleElement.innerText = Item.category;
                        }
                    }
                }
            } else {
                if (toolTipElement) {
                    toolTipElement.style.display = 'none';
                }
            }
        }
    }

    public toolbarCustomIconOnViewInit(): void {
        const icon = '<svg width="22px" height="22px" stroke="none" viewBox="0 0 224.87999 225" height="300" preserveAspectRatio="xMidYMid meet" version="1.0"><defs><clipPath id="3e09cefffb"><path d="M 76 30.199219 L 224.761719 30.199219 L 224.761719 179 L 76 179 Z M 76 30.199219 " clip-rule="nonzero"/></clipPath><clipPath id="336336d306"><path d="M 60.277344 46 L 209 46 L 209 195 L 60.277344 195 Z M 60.277344 46 " clip-rule="nonzero"/></clipPath></defs><g clip-path="url(#3e09cefffb)"><path fill="#bebfbf" d="M 224.851562 178.777344 L 76.273438 30.199219 L 118.8125 30.199219 L 194.769531 106.15625 L 194.769531 30.199219 L 224.851562 30.199219 Z M 224.851562 178.777344 " fill-opacity="1" fill-rule="evenodd"/></g><g clip-path="url(#336336d306)"><path fill="#3661ac" d="M 60.296875 46.21875 L 208.878906 194.796875 L 166.335938 194.796875 L 90.378906 118.839844 L 90.378906 194.796875 L 60.296875 194.796875 Z M 60.296875 46.21875 " fill-opacity="1" fill-rule="evenodd"/></g></svg>';
        this.toolbar.registerIconFromText("CustomCollection", "NextIcon", icon);
    }

    public toolbarToggleAction(sender: any, args: IgcToolCommandEventArgs): void {
        switch (args.command.commandId)
        {
            case "GetSelectedData":
                const isAllFalse = (this.chartData as { isSelected: boolean }[]).every(item => item.isSelected === false);
                if (isAllFalse) {
                    alert("チャートが選択されていません。");
                } else {
                    const selectedCategories = (this.chartData as { isSelected: boolean, category: string }[]).filter(item => item.isSelected === true).map(item => item.category);
                    const filteredData = this.tabularData?.filter(item => selectedCategories.includes(item[this.category]));
                    alert("以下のデータが選択されています。\n" + JSON.stringify(filteredData, null, "  "));
                    console.log(filteredData);
                }
                break;
            case "EnableSelecting":
                var enable = args.command.argumentsList[0].value as boolean;
    			if (enable)
    			{
    				this.enableSelecting = true;
                    const toolTipElement = document.getElementById('CustomTooltip');
                    if (toolTipElement) {
                        toolTipElement.style.display = 'none';
                    }
    			}
    			else
    			{
    				this.enableSelecting = false;
                    this.columnSeries.notifyVisualPropertiesChanged();
                }
                break;
        }
    }

    private combineColumnAndData(fields: { [x: string]: {
        type: number; name: string | number;
    }; }, data: any[]) {
        var transformFields = Object.values(fields);
        var transformDateData = data;
        if(fields[0].type == 3) {
            this.dataNodeLayer = {
                id:"1",
                name: "Years",
                children: [
                    {
                        id: "2",
                        name: "Month",
                        children: [
                            {
                                id: "3",
                                name: "Date",
                            }
                        ]
                    }
                ]
            };

            this.canDrillDown = true;
            var insertMonth = {
                "name": "Month",
                "type": 4
            };
            var insertYears = {
                "name": "Years",
                "type": 4
            };
            transformFields.splice(1, 0, insertMonth);
            transformFields.splice(2, 0, insertYears);
            transformDateData = this.transformDateData(data);
        }
        //console.log(transformFields, transformDateData);
        return transformDateData.map(record => {
            const combinedRecord: { [key: string]: any } = {}; // Add index signature
            record.forEach((value: any, index: string | number) => {
                combinedRecord[transformFields[Number(index)].name] = value;
            });
            return combinedRecord;
        });
    }

    private transformDateData(data: any[]) {
        return data.map(item => {
            let date = new Date(item[0]);
            let year = date.getFullYear();
            let month = ('0' + (date.getMonth() + 1)).slice(-2);
            return [
                item[0],
                `${year}-${month}`,
                `${year}`,
                ...item.slice(1)
            ];
        });
    }

    private aggregateDataByCategory(data: any[], category: string, target: any) {
        const aggregatedData: { [key: string]: number } = {};
        data.forEach((item) => {
            const cat = item[category];
            const sum = item[target];

            if (aggregatedData[cat]) {
                aggregatedData[cat] += sum;
            } else {
                aggregatedData[cat] = sum;
            }
        });

        return Object.keys(aggregatedData).map((key) => ({
            "category": String(key),
            "value": aggregatedData[key],
            "isSelected": false
        }));
    }

    private findMaxValue(data: any[]) {
        // data配列からvalueの最大値を見つける
        const maxValue = data.reduce((max, item) => Math.max(max, item.value), data[0].value);
        return maxValue;
    }

    private increaseFirstDigit(n: number): number {
        // let str = n.toString();
        // let firstDigit = parseInt(str[0]);
        // firstDigit++;
        // let rest = str.slice(1).replace(/[0-9]/g, '0');
        // return parseInt(firstDigit + rest);
        return n * 1.15;
    }

    private getLastWordFromString(inputString: string) {
        // 文字列を半角スペースで分割
        const words = inputString.split(' ');
        // 分割した配列から最後の要素を取得
        return words[words.length - 1];
    }

    // 最上層のアイテムかどうかを判別する関数
    private isTopLevel(node: Node, rootNode: Node): boolean {
        return node === rootNode;
    }

    // 最下層のアイテムかどうかを判別する関数
    private isBottomLevel(node: Node): boolean {
        // console.log(node);
        return !node.children || node.children.length === 0;
    }

    private findNodeByName<T>(node: Node, name: string): Node | null {
        // console.log(node, name);
        // 現在のノードが目的のnameを持つかチェック
        if (node.name === name) {
          return node;
        }

        // 子ノードがあれば、それぞれを再帰的に探索
        if (node.children) {
          for (const child of node.children) {
            const result = this.findNodeByName(child, name);
            if (result) {
              return result; // 目的のノードが見つかったら、すぐに返す
            }
          }
        }

        // 目的のノードが見つからなければnullを返す
        return null;
    }

    private findParentNode<T>(node: Node, targetName: string, parent: Node | null = null): Node | null {
        //console.log(node, targetName, parent);
        //parent = this.findNodeByName(node, "Years");
        // 子ノードを探索
        if (node.children) {
          for (const child of node.children) {
            // 指定されたIDのノードを見つけた場合、その親ノードを返す
            if (child.name === targetName) {
                if (parent === null) {
                    return this.findNodeByName(node, "Years");
                } else {
                    return parent;
                }
            }

            // 子ノードにさらに子ノードがある場合は、再帰的に探索
            const foundParent = this.findParentNode(child, targetName, child);
            if (foundParent) {
              return foundParent;
            }
          }
        }

        // 指定されたIDのノードまたはその親ノードが見つからない場合
        return null;
      }

}

new SKNextColumnChart();
