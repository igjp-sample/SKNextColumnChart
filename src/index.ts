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
import { IgcValueOverlayModule } from '@infragistics/igniteui-webcomponents-charts';
import { HighestGrossingMoviesItem, HighestGrossingMovies } from './HighestGrossingMovies';
import { DataTemplateRenderInfo, DataTemplateMeasureInfo, ModuleManager } from '@infragistics/igniteui-webcomponents-core';

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

export class SKNextColumnChart {

    private legend: IgcLegendComponent
    private toolbar: IgcToolbarComponent
    private analyzeMenu: IgcToolActionIconMenuComponent
    private chart: IgcDataChartComponent
    private xAxis: IgcCategoryXAxisComponent
    private yAxis: IgcNumericYAxisComponent
    private columnSeries: IgcColumnSeriesComponent
    //private pointSeries: IgcPointSeriesComponent
    //private calloutLayer: IgcCalloutLayerComponent
    private _bind: () => void;

    constructor() {
        this.onAssigningCategoryStyle = this.onAssigningCategoryStyle.bind(this);

        var legend = this.legend = document.getElementById('Legend') as unknown as IgcLegendComponent;
        var toolbar = this.toolbar = document.getElementById('Toolbar') as IgcToolbarComponent;
        var analyzeMenu = this.analyzeMenu = document.getElementById('AnalyzeMenu') as IgcToolActionIconMenuComponent;
        var chart = this.chart = document.getElementById('Chart') as unknown as IgcDataChartComponent;
        var yAxis = this.yAxis = document.getElementById('yAxis') as unknown as IgcNumericYAxisComponent;
        var xAxis = this.xAxis = document.getElementById('xAxis') as unknown as IgcCategoryXAxisComponent
        //var calloutLayer = this.calloutLayer = document.getElementById('CalloutLayer') as IgcCalloutLayerComponent;
        var columnSeries = this.columnSeries = document.getElementById('ColumnSeries') as unknown as IgcColumnSeriesComponent;
        //var pointSeries = this.pointSeries = document.getElementById('PointSeries') as IgcPointSeriesComponent;
        this.chart.highlightedValuesDisplayMode = 1;
        this._bind = () => {
            toolbar.target = this.chart;
            chart.legend = this.legend;
            xAxis.dataSource = this.highestGrossingMovies;
            xAxis.tickLength = 0;
            xAxis.labelTopMargin = 10;
            xAxis.labelTextStyle = "12px Helvetica";
            yAxis.majorStrokeThickness = 0;
            yAxis.labelTextStyle = "12px Helvetica";
            yAxis.formatLabel = function (num) {
                return num.toLocaleString();
            };
            columnSeries.xAxis = this.xAxis;
            columnSeries.yAxis = this.yAxis;
            columnSeries.dataSource = this.highestGrossingMovies;
            columnSeries.shouldHideAutoCallouts = false;
            columnSeries.markerTemplate = this.getMarker();
            columnSeries.isCustomCategoryStyleAllowed = true;
            columnSeries.assigningCategoryStyle = this.onAssigningCategoryStyle;
            columnSeries.isHighlightingEnabled = false;
            chart.seriesMouseLeftButtonUp = this.onSeriesMouseLeftButtonUp;

            //pointSeries.xAxis = this.xAxis;
            //pointSeries.yAxis = this.yAxis;
            //pointSeries.dataSource = this.highestGrossingMovies;
        }
        this._bind();
        this.toolbarCustomIconOnViewInit();
    }

    public onAssigningCategoryStyle = (
        sender: IgcCategorySeriesComponent,
        evt: IgcAssigningCategoryStyleEventArgs) => {
        let items = evt.getItems(evt.startIndex, evt.endIndex);
        for (let i = 0; i < items.length; i++) {
            if (items[i].isSelected) {
                evt.strokeThickness = 5;
                //evt.stroke = "#c97d5a";
                evt.fill = "#3a6b8e";
            } else {
                //evt.opacity = 0.5;
            }
        }
    }
    public onSeriesMouseLeftButtonUp = (
        sender: IgcSeriesViewerComponent,
        evt: IgcDataChartMouseButtonEventArgs
    ) => {
        if (evt.item) {
            evt.item.isSelected = !evt.item.isSelected;
            this.columnSeries.notifyVisualPropertiesChanged();
        }
    }

    public getMarker(): any {
        const targetField = this.columnSeries.valueMemberPath;
        return {
            measure: function (measureInfo: DataTemplateMeasureInfo) {
                const context = measureInfo.context;
                const height = context.measureText("M").width;
                const width = measureInfo.data.item[targetField].toLocaleString().length * 8;
                measureInfo.width = width;
                measureInfo.height = height + 12;
            },
            render: function (renderInfo: DataTemplateRenderInfo) {
                let ctx = renderInfo.context;
                let x = renderInfo.xPosition;
                let y = renderInfo.yPosition;

                if (renderInfo.isHitTestRender) return;
                const dataItem = renderInfo.data.item;
                if (dataItem === null) return;

                const dataValue = dataItem[targetField];

                ctx.fillStyle = '#ceddee';
                const width = dataValue.toLocaleString().length * 8;
                let height = renderInfo.availableHeight;
                ctx.beginPath();
                ctx.roundRect(x - (width / 2), y - (height*1.3), width, height*0.75, 5);
                ctx.fill();

                ctx.font = 'bold 12px Helvetica';
                ctx.textAlign = 'center';
                ctx.fontWeight = 'bolder';
                ctx.fillStyle = "black";

                ctx.fillText(dataValue.toLocaleString(), x, y - (height*0.75))

                ctx.beginPath();
                ctx.stroke();
                ctx.fill();
            }
        }
    }

    private _highestGrossingMovies: HighestGrossingMovies | undefined;
    public get highestGrossingMovies(): HighestGrossingMovies {
        if (this._highestGrossingMovies == null)
        {
            this._highestGrossingMovies = new HighestGrossingMovies();
        }
        return this._highestGrossingMovies;
    }

    public toolbarCustomIconOnViewInit(): void {
        const icon = '<svg width="28px" height="28px" stroke="none" viewBox="0 0 3.5 3.5" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--gis" preserveAspectRatio="xMidYMid meet"><path d="M0.436 0.178a0.073 0.073 0 0 0 -0.062 0.036L0.01 0.846a0.073 0.073 0 0 0 0.063 0.109h0.729a0.073 0.073 0 0 0 0.063 -0.109L0.501 0.214a0.073 0.073 0 0 0 -0.064 -0.036zm0.001 0.219 0.238 0.413H0.199zM1.4 0.507v0.245h0.525v-0.245zm0.77 0v0.245h1.33v-0.245zM0.073 1.388A0.073 0.073 0 0 0 0 1.461v0.583a0.073 0.073 0 0 0 0.073 0.073h0.729A0.073 0.073 0 0 0 0.875 2.045V1.461a0.073 0.073 0 0 0 -0.073 -0.073zm0.073 0.146h0.583v0.438H0.146zM1.4 1.674v0.245h0.945v-0.245zm1.19 0v0.245h0.91v-0.245zM0.438 2.447c-0.241 0 -0.438 0.197 -0.438 0.438 0 0.241 0.197 0.438 0.438 0.438s0.438 -0.197 0.438 -0.438c0 -0.241 -0.197 -0.438 -0.438 -0.438zm0 0.146a0.291 0.291 0 0 1 0.292 0.292 0.291 0.291 0 0 1 -0.292 0.292 0.291 0.291 0 0 1 -0.292 -0.292A0.291 0.291 0 0 1 0.438 2.593zM1.4 2.842v0.245h0.525v-0.245zm0.77 0v0.245h1.33v-0.245z" fill="#000000" fill-rule="evenodd"/></svg>';
        this.toolbar.registerIconFromText("CustomCollection", "CustomIcon", icon);
    }

}

new SKNextColumnChart();
