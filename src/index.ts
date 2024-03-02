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
            crosshairLayer.cursorPosition = { x: 0, y: 0 };
            xAxis.formatLabel = this.formatDateString;
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
    public onSeriesMouseLeftButtonUp = (
        sender: IgcSeriesViewerComponent,
        evt: IgcDataChartMouseButtonEventArgs
    ) => {
        if (this.enableSelecting) {
            if (evt.item) {
                evt.item.isSelected = !evt.item.isSelected;
                (this.chartData as []).forEach((dataItem: any) => {
                    if (dataItem.category === evt.item.category) {
                        dataItem.isSelected = evt.item.isSelected;
                    }
                });
                this.columnSeries.notifyVisualPropertiesChanged();
            }
        } else {

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

    public onClick = (evt:MouseEvent) => {
        console.log(evt);
        evt.stopPropagation();
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
                }
                break;
            case "EnableSelecting":
                var enable = args.command.argumentsList[0].value as boolean;
    			if (enable)
    			{
    				this.enableSelecting = true;
    			}
    			else
    			{
    				this.enableSelecting = false;
                    this.columnSeries.notifyVisualPropertiesChanged();
                }
                break;
        }
    }

    private combineColumnAndData(fields: { [x: string]: { name: string | number; }; }, data: any[]) {
        return data.map(record => {
            const combinedRecord: { [key: string]: any } = {}; // Add index signature
            record.forEach((value: any, index: string | number) => {
                combinedRecord[fields[index].name] = value;
            });
            return combinedRecord;
        });
    }

    private aggregateDataByCategory(data: any[], category: string, target: number) {
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

}

new SKNextColumnChart();
