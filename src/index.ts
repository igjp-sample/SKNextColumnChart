import 'igniteui-webcomponents/themes/light/bootstrap.css'

import '@webcomponents/custom-elements/custom-elements.min';
import '@webcomponents/custom-elements/src/native-shim.js';

import { IgcLegendModule, IgcCategoryChartModule } from '@infragistics/igniteui-webcomponents-charts';
import { IgcLegendComponent, IgcCategoryChartComponent } from '@infragistics/igniteui-webcomponents-charts';
import { HighestGrossingMoviesItem, HighestGrossingMovies } from './HighestGrossingMovies';

import { ModuleManager } from '@infragistics/igniteui-webcomponents-core';

ModuleManager.register(
    IgcLegendModule,
    IgcCategoryChartModule
);

export class SKNextColumnChart {

    private legend: IgcLegendComponent
    private chart: IgcCategoryChartComponent
    private _bind: () => void;

    constructor() {
        var legend = this.legend = document.getElementById('Legend') as IgcLegendComponent;
        var chart = this.chart = document.getElementById('chart') as IgcCategoryChartComponent;

        this._bind = () => {
            chart.dataSource = this.highestGrossingMovies;
            chart.legend = this.legend;
        }
        this._bind();

    }

    private _highestGrossingMovies: HighestGrossingMovies | undefined;
    public get highestGrossingMovies(): HighestGrossingMovies {
        if (this._highestGrossingMovies == null)
        {
            this._highestGrossingMovies = new HighestGrossingMovies();
        }
        return this._highestGrossingMovies;
    }

}

new SKNextColumnChart();
