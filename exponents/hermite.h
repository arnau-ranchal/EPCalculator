#ifndef HERMITE_H
#define HERMITE_H

#include <vector>

using namespace std;

// Returns the roots of the Hermite polynomial of degree n (up to n = 500)
vector<double> Hroots(int n);

// Computes Hermite quadrature weights for n points
vector<double> Hweights(int my_n);

#endif // HERMITE_H
